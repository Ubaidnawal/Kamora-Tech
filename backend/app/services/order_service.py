from datetime import datetime, timezone
from typing import Any

from fastapi import HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import (
    AdminActivityLog,
    CartStatus,
    Order,
    OrderItem,
    OrderNote,
    OrderStatus,
    OrderStatusHistory,
    Payment,
    PaymentStatus,
    ProductStatus,
    User,
)
from app.schemas.commerce import (
    AdminOrderUpdateIn,
    AdminPaymentUpdateIn,
    CheckoutIn,
    GuestCheckoutIn,
    TrackOut,
)
from app.services.cart_service import cart_currency, cart_total, get_cart
from app.utils.ids import generate_order_number, generate_tracking_id

def _order_options() -> tuple:
    return (
        selectinload(Order.items),
        selectinload(Order.payments),
        selectinload(Order.status_history),
    )

async def _load_order(db: AsyncSession, order_id: str) -> Order | None:
    result = await db.scalars(select(Order).where(Order.id == order_id).options(*_order_options()))
    return result.unique().first()

async def _unique_identifiers(db: AsyncSession) -> tuple[str, str]:
    for _ in range(10):
        order_number = generate_order_number()
        tracking_id = generate_tracking_id()
        exists = await db.scalar(
            select(func.count(Order.id)).where(
                (Order.order_number == order_number) | (Order.tracking_id == tracking_id)
            )
        )
        if not exists:
            return order_number, tracking_id
    raise HTTPException(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        detail="Unable to generate unique order identifiers",
    )

def _utc_naive() -> datetime:
    return datetime.now(timezone.utc).replace(tzinfo=None)

def log_admin_activity(
    db: AsyncSession,
    admin: User,
    action: str,
    target_type: str,
    target_id: str | None = None,
    details: dict[str, Any] | None = None,
    ip_address: str | None = None,
) -> AdminActivityLog:
    entry = AdminActivityLog(
        admin_id=admin.id,
        action=action,
        target_type=target_type,
        target_id=target_id,
        details=details or {},
        ip_address=ip_address,
    )
    db.add(entry)
    return entry

async def create_order_from_cart(db: AsyncSession, user: User, checkout: CheckoutIn) -> Order:
    cart = await get_cart(db, user.id)
    if cart is None or not cart.items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Your cart is empty")

    for item in cart.items:
        product = item.product
        if (
            product is None
            or product.is_deleted
            or not product.is_active
            or product.status != ProductStatus.active
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A product in your cart is no longer available",
            )

    order_number, tracking_id = await _unique_identifiers(db)
    total = cart_total(cart)
    first = cart.items[0]
    snapshot = first.product.name if first.product is not None else "Product"
    if len(cart.items) > 1:
        snapshot = f"{snapshot} (+{len(cart.items) - 1} more)"

    order = Order(
        order_number=order_number,
        tracking_id=tracking_id,
        user_id=user.id,
        product_id=first.product_id,
        product_name_snapshot=snapshot[:200],
        customer_name=checkout.customer_name,
        customer_email=str(checkout.customer_email),
        customer_phone=checkout.customer_phone,
        business_name=checkout.business_name,
        project_requirements=checkout.project_requirements,
        additional_instructions=checkout.additional_instructions,
        amount=total,
        currency=cart_currency(cart),
        payment_status=PaymentStatus.awaiting_payment,
        order_status=OrderStatus.pending,
    )

    for item in cart.items:
        product = item.product
        price = float(product.price) if product is not None and product.price is not None else None
        order.items.append(
            OrderItem(
                product_id=item.product_id,
                product_name_snapshot=(product.name if product is not None else "Product")[:200],
                unit_price=price,
                quantity=item.quantity,
                line_total=round(price * item.quantity, 2) if price is not None else None,
            )
        )

    order.status_history.append(
        OrderStatusHistory(
            from_status=None,
            to_status=OrderStatus.pending,
            note="Order placed",
        )
    )
    db.add(order)

    items = list(cart.items)
    cart.items.clear()
    for item in items:
        await db.delete(item)
    cart.status = CartStatus.converted

    await db.commit()
    loaded = await _load_order(db, order.id)
    if loaded is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Order could not be loaded")
    return loaded


async def create_guest_order_from_items(db: AsyncSession, checkout: GuestCheckoutIn) -> Order:
    seen_product_ids: set[str] = set()
    for item in checkout.items:
        if item.product_id in seen_product_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate product in checkout")
        seen_product_ids.add(item.product_id)

    from app.services.catalog_service import get_purchasable_product

    resolved: list[tuple[Any, int]] = []
    for item in checkout.items:
        product = await get_purchasable_product(db, item.product_id)
        if product is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product unavailable: {item.product_id}",
            )
        if product.price is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Product price unavailable: {item.product_id}",
            )
        resolved.append((product, item.quantity))

    currencies = {product.currency for product, _ in resolved if product.currency}
    if len(currencies) != 1:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Products must use the same currency")
    currency = currencies.pop()

    total = round(sum(float(product.price) * quantity for product, quantity in resolved), 2)
    order_number, tracking_id = await _unique_identifiers(db)
    first_product, _ = resolved[0]
    snapshot = first_product.name
    if len(resolved) > 1:
        snapshot = f"{snapshot} (+{len(resolved) - 1} more)"

    order = Order(
        order_number=order_number,
        tracking_id=tracking_id,
        user_id=None,
        product_id=first_product.id,
        product_name_snapshot=snapshot[:200],
        customer_name=checkout.customer_name,
        customer_email=str(checkout.customer_email),
        customer_phone=checkout.customer_phone,
        business_name=checkout.business_name,
        project_requirements=checkout.project_requirements,
        additional_instructions=checkout.additional_instructions,
        amount=total,
        currency=currency,
        payment_status=PaymentStatus.awaiting_payment,
        order_status=OrderStatus.pending,
    )

    for product, quantity in resolved:
        unit_price = float(product.price)
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name_snapshot=product.name[:200],
                unit_price=unit_price,
                quantity=quantity,
                line_total=round(unit_price * quantity, 2),
            )
        )

    order.status_history.append(
        OrderStatusHistory(
            from_status=None,
            to_status=OrderStatus.pending,
            note="Order placed",
        )
    )
    db.add(order)
    await db.commit()
    loaded = await _load_order(db, order.id)
    if loaded is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Order could not be loaded")
    return loaded

async def get_user_orders(db: AsyncSession, user_id: str) -> list[Order]:
    result = await db.scalars(
        select(Order)
        .where(Order.user_id == user_id)
        .options(*_order_options())
        .order_by(Order.created_at.desc())
    )
    return list(result.unique())

async def get_user_order(db: AsyncSession, user_id: str, order_id: str) -> Order | None:
    result = await db.scalars(
        select(Order).where(Order.id == order_id, Order.user_id == user_id).options(*_order_options()).limit(1)
    )
    return result.unique().first()

async def get_order_by_id(db: AsyncSession, order_id: str) -> Order | None:
    return await _load_order(db, order_id)

async def get_order_by_tracking_public(db: AsyncSession, identifier: str) -> TrackOut | None:
    result = await db.scalars(
        select(Order)
        .where(or_(Order.tracking_id == identifier, Order.order_number == identifier, Order.id == identifier))
        .options(selectinload(Order.status_history))
        .limit(1)
    )
    order = result.unique().first()
    if order is None:
        return None
    return TrackOut(
        tracking_id=order.tracking_id,
        order_number=order.order_number,
        order_status=order.order_status,
        payment_status=order.payment_status,
        timeline=sorted(order.status_history, key=lambda entry: entry.created_at),
        created_at=order.created_at,
        updated_at=order.updated_at,
    )

async def list_all_orders(db: AsyncSession, *, skip: int = 0, limit: int = 50) -> list[Order]:
    result = await db.scalars(
        select(Order).options(*_order_options()).order_by(Order.created_at.desc()).offset(skip).limit(limit)
    )
    return list(result.unique())

async def admin_update_order_status(
    db: AsyncSession,
    admin: User,
    order_id: str,
    payload: AdminOrderUpdateIn,
    ip_address: str | None = None,
) -> Order | None:
    order = await _load_order(db, order_id)
    if order is None:
        return None
    previous = order.order_status
    order.order_status = payload.order_status
    order.status_history.append(
        OrderStatusHistory(
            from_status=previous,
            to_status=payload.order_status,
            changed_by_admin_id=admin.id,
            note=payload.note,
        )
    )
    log_admin_activity(
        db,
        admin,
        "order.status_updated",
        "order",
        order.id,
        {"from": previous.value, "to": payload.order_status.value, "note": payload.note},
        ip_address,
    )
    await db.commit()
    return await _load_order(db, order.id)

async def _record_payment(
    db: AsyncSession,
    admin: User,
    order_id: str,
    payload: AdminPaymentUpdateIn,
    ip_address: str | None = None,
) -> tuple[Order | None, Payment | None]:
    order = await _load_order(db, order_id)
    if order is None:
        return None, None

    amount = float(order.amount) if order.amount is not None else None
    paid_at = payload.paid_at
    if paid_at is None and payload.status == PaymentStatus.paid:
        paid_at = _utc_naive()
    elif paid_at is not None and paid_at.tzinfo is not None:
        paid_at = paid_at.astimezone(timezone.utc).replace(tzinfo=None)

    payment = Payment(
        order_id=order.id,
        amount=amount,
        currency=order.currency,
        status=payload.status,
        provider=payload.provider,
        provider_reference=payload.provider_reference,
        paid_at=paid_at,
    )
    db.add(payment)
    await db.flush()
    previous_payment_status = order.payment_status
    order.payment_status = payload.status
    note = f"Payment status set to {payload.status.value}"
    if payload.note:
        note = f"{note}: {payload.note}"
    order.status_history.append(
        OrderStatusHistory(
            from_status=order.order_status,
            to_status=order.order_status,
            changed_by_admin_id=admin.id,
            note=note,
        )
    )
    log_admin_activity(
        db,
        admin,
        "order.payment_updated",
        "order",
        order.id,
        {
            "payment_id": payment.id,
            "from": previous_payment_status.value,
            "to": payload.status.value,
            "provider": payload.provider,
        },
        ip_address,
    )
    await db.commit()
    loaded = await _load_order(db, order.id)
    return loaded, payment

async def admin_update_payment(
    db: AsyncSession,
    admin: User,
    order_id: str,
    payload: AdminPaymentUpdateIn,
    ip_address: str | None = None,
) -> Order | None:
    order, _ = await _record_payment(db, admin, order_id, payload, ip_address)
    return order

async def record_payment(
    db: AsyncSession,
    admin: User,
    order_id: str,
    payload: AdminPaymentUpdateIn,
    ip_address: str | None = None,
) -> Payment | None:
    _, payment = await _record_payment(db, admin, order_id, payload, ip_address)
    return payment

async def add_admin_note(
    db: AsyncSession,
    admin: User,
    order_id: str,
    note: str,
    ip_address: str | None = None,
) -> Order | None:
    order = await _load_order(db, order_id)
    if order is None:
        return None
    db.add(
        OrderNote(
            order_id=order.id,
            author_id=admin.id,
            author_role="admin",
            note=note,
            is_internal=True,
        )
    )
    order.admin_notes = f"{order.admin_notes}\n{note}" if order.admin_notes else note
    order.status_history.append(
        OrderStatusHistory(
            from_status=order.order_status,
            to_status=order.order_status,
            changed_by_admin_id=admin.id,
            note=f"Admin note: {note}",
        )
    )
    log_admin_activity(db, admin, "order.note_added", "order", order.id, {"note": note}, ip_address)
    await db.commit()
    return await _load_order(db, order.id)
