import re
from datetime import datetime, timezone
from typing import Annotated, Any

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    Query,
    Request,
    UploadFile,
    status,
)
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.security import get_current_admin
from app.database.connection import get_db
from app.models import (
    ContactMessage,
    CustomerMessage,
    MessageStatus,
    Order,
    OrderItem,
    OrderStatus,
    Payment,
    PaymentStatus,
    Product,
    ProductCategory,
    ProductImage,
    ProjectInquiry,
    SiteSetting,
    User,
    UserStatus,
)
from app.schemas.commerce import (
    AdminCategoryIn,
    AdminDashboardOut,
    AdminMessageReplyIn,
    AdminMessageStatusIn,
    AdminOrderNoteIn,
    AdminOrderUpdateIn,
    AdminPaymentUpdateIn,
    AdminProductIn,
    AdminProductListOut,
    AdminProductOut,
    AdminUserOut,
    AdminUserStatusIn,
    CategoryOut,
    ContactOut,
    InquiryOut,
    MessageOut,
    MonthlyOrderOut,
    OrderOut,
    PaymentOut,
    ProductImageOut,
    ReportOut,
    SiteSettingIn,
    SiteSettingOut,
    TopProductOut,
)
from app.services import catalog_service, order_service, upload_service

try:
    from app.core.security import verify_csrf_token as csrf_guard
except ImportError:

    async def csrf_guard() -> None:
        return None


router = APIRouter(
    prefix="/admin",
    tags=["admin"],
    dependencies=[Depends(get_current_admin)],
)

DbSession = Annotated[AsyncSession, Depends(get_db)]
AdminUser = Annotated[User, Depends(get_current_admin)]


def _client_ip(request: Request) -> str | None:
    return request.client.host if request.client else None


def _slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")[:160]
    return slug or "item"


async def _unique_slug(
    db: AsyncSession,
    model: Any,
    value: str,
    current_id: str | None = None,
) -> str:
    base = _slugify(value)
    candidate = base
    suffix = 2
    while True:
        stmt = select(func.count(model.id)).where(model.slug == candidate)
        if current_id is not None:
            stmt = stmt.where(model.id != current_id)
        if not await db.scalar(stmt):
            return candidate
        candidate = f"{base}-{suffix}"[:160]
        suffix += 1


async def _ensure_category(db: AsyncSession, category_id: str | None) -> None:
    if category_id is None:
        return
    exists = await db.scalar(select(func.count(ProductCategory.id)).where(ProductCategory.id == category_id))
    if not exists:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")


def _user_out(user: User) -> AdminUserOut:
    return AdminUserOut(
        id=user.id,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        is_active=user.is_active,
        is_verified=user.is_verified,
        status=user.status,
        roles=[role.name.value if hasattr(role.name, "value") else str(role.name) for role in user.roles],
        created_at=user.created_at,
    )


def _message_out(message: CustomerMessage) -> MessageOut:
    return MessageOut(
        id=message.id,
        user_id=message.user_id,
        order_id=message.order_id,
        subject=message.subject,
        message=message.message,
        status=message.status,
        admin_reply=message.admin_reply,
        user_name=message.user.full_name if message.user is not None else None,
        user_email=message.user.email if message.user is not None else None,
        created_at=message.created_at,
    )


@router.get("/dashboard", response_model=AdminDashboardOut)
async def get_dashboard(db: DbSession) -> AdminDashboardOut:
    total_users = int(await db.scalar(select(func.count(User.id))) or 0)
    total_products = int(
        await db.scalar(select(func.count(Product.id)).where(Product.is_deleted.is_(False))) or 0
    )
    total_categories = int(
        await db.scalar(select(func.count(ProductCategory.id)).where(ProductCategory.is_deleted.is_(False))) or 0
    )
    total_orders = int(await db.scalar(select(func.count(Order.id))) or 0)
    pending_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.order_status == OrderStatus.pending)) or 0
    )
    confirmed_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.order_status == OrderStatus.confirmed)) or 0
    )
    in_progress_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.order_status == OrderStatus.in_progress)) or 0
    )
    completed_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.order_status == OrderStatus.completed)) or 0
    )
    paid_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.payment_status == PaymentStatus.paid)) or 0
    )
    open_messages = int(
        await db.scalar(select(func.count(CustomerMessage.id)).where(CustomerMessage.status == MessageStatus.open))
        or 0
    )
    revenue = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0.0)).where(Payment.status == PaymentStatus.paid)
    )
    recent_order_rows = await db.scalars(
        select(Order)
        .options(
            selectinload(Order.items),
            selectinload(Order.payments),
            selectinload(Order.status_history),
        )
        .order_by(Order.created_at.desc())
        .limit(5)
    )
    recent_user_rows = await db.scalars(
        select(User).options(selectinload(User.roles)).order_by(User.created_at.desc()).limit(5)
    )
    return AdminDashboardOut(
        total_users=total_users,
        total_products=total_products,
        total_categories=total_categories,
        total_orders=total_orders,
        pending_orders=pending_orders,
        confirmed_orders=confirmed_orders,
        in_progress_orders=in_progress_orders,
        completed_orders=completed_orders,
        paid_orders=paid_orders,
        open_messages=open_messages,
        revenue_paid=round(float(revenue or 0.0), 2),
        recent_orders=[OrderOut.model_validate(order) for order in recent_order_rows.unique()],
        recent_registrations=[_user_out(user) for user in recent_user_rows.unique()],
    )


@router.get("/users", response_model=list[AdminUserOut])
async def list_users(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[AdminUserOut]:
    result = await db.scalars(
        select(User).options(selectinload(User.roles)).order_by(User.created_at.desc()).offset(skip).limit(limit)
    )
    return [_user_out(user) for user in result.unique()]


@router.patch(
    "/users/{user_id}/status",
    response_model=AdminUserOut,
    dependencies=[Depends(csrf_guard)],
)
async def update_user_status(
    user_id: str,
    payload: AdminUserStatusIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> AdminUserOut:
    result = await db.scalars(select(User).where(User.id == user_id).options(selectinload(User.roles)).limit(1))
    user = result.unique().first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    user.status = payload.status
    user.is_active = payload.status == UserStatus.active
    order_service.log_admin_activity(
        db,
        admin,
        "user.status_updated",
        "user",
        user.id,
        {"status": payload.status.value},
        _client_ip(request),
    )
    await db.commit()
    return _user_out(user)


@router.get("/products", response_model=AdminProductListOut)
async def list_admin_products(
    db: DbSession,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
) -> AdminProductListOut:
    products, total = await catalog_service.list_products(
        db,
        page=page,
        page_size=page_size,
        include_inactive=True,
        include_deleted=True,
    )
    return AdminProductListOut(
        items=[AdminProductOut.model_validate(product) for product in products],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post(
    "/products",
    response_model=AdminProductOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_guard)],
)
async def create_product(
    payload: AdminProductIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> AdminProductOut:
    await _ensure_category(db, payload.category_id)
    slug = await _unique_slug(db, Product, payload.slug or payload.name)
    product = Product(
        name=payload.name,
        slug=slug,
        category_id=payload.category_id,
        short_description=payload.short_description,
        description=payload.description,
        features=payload.features,
        specifications=payload.specifications,
        price=payload.price,
        currency=payload.currency,
        status=payload.status,
        is_active=payload.is_active,
        is_featured=payload.is_featured,
        sort_order=payload.sort_order,
    )
    db.add(product)
    await db.flush()
    order_service.log_admin_activity(
        db,
        admin,
        "product.created",
        "product",
        product.id,
        {"name": product.name, "slug": product.slug},
        _client_ip(request),
    )
    await db.commit()
    loaded = await catalog_service.get_product(db, product.id, include_inactive=True, include_deleted=True)
    if loaded is None:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Product could not be loaded")
    return AdminProductOut.model_validate(loaded)


@router.put("/products/{product_id}", response_model=AdminProductOut, dependencies=[Depends(csrf_guard)])
async def update_product(
    product_id: str,
    payload: AdminProductIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> AdminProductOut:
    result = await db.scalars(
        select(Product)
        .where(Product.id == product_id, Product.is_deleted.is_(False))
        .options(selectinload(Product.images), selectinload(Product.category))
        .limit(1)
    )
    product = result.unique().first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    await _ensure_category(db, payload.category_id)
    product.name = payload.name
    product.slug = await _unique_slug(db, Product, payload.slug or payload.name, current_id=product.id)
    product.category_id = payload.category_id
    product.short_description = payload.short_description
    product.description = payload.description
    product.features = payload.features
    product.specifications = payload.specifications
    product.price = payload.price
    product.currency = payload.currency
    product.status = payload.status
    product.is_active = payload.is_active
    product.is_featured = payload.is_featured
    product.sort_order = payload.sort_order
    order_service.log_admin_activity(
        db,
        admin,
        "product.updated",
        "product",
        product.id,
        {"name": product.name, "slug": product.slug},
        _client_ip(request),
    )
    await db.commit()
    return AdminProductOut.model_validate(product)


@router.delete("/products/{product_id}", dependencies=[Depends(csrf_guard)])
async def delete_product(
    product_id: str,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> dict[str, str]:
    result = await db.scalars(select(Product).where(Product.id == product_id, Product.is_deleted.is_(False)).limit(1))
    product = result.unique().first()
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    product.is_deleted = True
    product.deleted_at = datetime.now(timezone.utc)
    product.is_active = False
    order_service.log_admin_activity(
        db,
        admin,
        "product.soft_deleted",
        "product",
        product.id,
        {"name": product.name},
        _client_ip(request),
    )
    await db.commit()
    return {"message": "Product deleted"}


@router.post(
    "/products/{product_id}/images",
    response_model=ProductImageOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_guard)],
)
async def upload_product_image(
    product_id: str,
    request: Request,
    db: DbSession,
    admin: AdminUser,
    file: UploadFile = File(...),
) -> ProductImageOut:
    product = await db.scalar(select(Product).where(Product.id == product_id, Product.is_deleted.is_(False)))
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found")
    url = await upload_service.save_product_image(file)
    image = ProductImage(product_id=product_id, url=url, alt_text=product.name, is_primary=not product.images)
    db.add(image)
    order_service.log_admin_activity(
        db,
        admin,
        "product.image_uploaded",
        "product",
        product_id,
        {"url": url},
        _client_ip(request),
    )
    await db.commit()
    await db.refresh(image)
    return ProductImageOut.model_validate(image)


@router.get("/categories", response_model=list[CategoryOut])
async def list_admin_categories(db: DbSession) -> list[CategoryOut]:
    categories = await catalog_service.list_categories(db, include_inactive=True)
    return [CategoryOut.model_validate(category) for category in categories]


@router.post(
    "/categories",
    response_model=CategoryOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_guard)],
)
async def create_category(
    payload: AdminCategoryIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> CategoryOut:
    slug = await _unique_slug(db, ProductCategory, payload.slug or payload.name)
    category = ProductCategory(
        name=payload.name,
        slug=slug,
        description=payload.description,
        is_active=payload.is_active,
    )
    db.add(category)
    await db.flush()
    order_service.log_admin_activity(
        db,
        admin,
        "category.created",
        "category",
        category.id,
        {"name": category.name, "slug": category.slug},
        _client_ip(request),
    )
    await db.commit()
    return CategoryOut.model_validate(category)


@router.get("/orders", response_model=list[OrderOut])
async def list_admin_orders(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[OrderOut]:
    orders = await order_service.list_all_orders(db, skip=skip, limit=limit)
    return [OrderOut.model_validate(order) for order in orders]


@router.put("/orders/{order_id}/status", response_model=OrderOut, dependencies=[Depends(csrf_guard)])
async def update_order_status(
    order_id: str,
    payload: AdminOrderUpdateIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> OrderOut:
    order = await order_service.admin_update_order_status(db, admin, order_id, payload, _client_ip(request))
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderOut.model_validate(order)


@router.put("/orders/{order_id}/payment", response_model=OrderOut, dependencies=[Depends(csrf_guard)])
async def update_order_payment(
    order_id: str,
    payload: AdminPaymentUpdateIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> OrderOut:
    order = await order_service.admin_update_payment(db, admin, order_id, payload, _client_ip(request))
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderOut.model_validate(order)


@router.post("/orders/{order_id}/notes", response_model=OrderOut, dependencies=[Depends(csrf_guard)])
async def add_order_note(
    order_id: str,
    payload: AdminOrderNoteIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> OrderOut:
    order = await order_service.add_admin_note(db, admin, order_id, payload.note, _client_ip(request))
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderOut.model_validate(order)


@router.get("/reports", response_model=ReportOut)
async def get_reports(db: DbSession) -> ReportOut:
    total_orders = int(await db.scalar(select(func.count(Order.id))) or 0)
    paid_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.payment_status == PaymentStatus.paid)) or 0
    )
    pending_payments = int(
        await db.scalar(select(func.count(Order.id)).where(Order.payment_status == PaymentStatus.pending)) or 0
    )
    cancelled_orders = int(
        await db.scalar(select(func.count(Order.id)).where(Order.order_status == OrderStatus.cancelled)) or 0
    )
    total_customers = int(await db.scalar(select(func.count(User.id))) or 0)
    completed_projects = int(
        await db.scalar(select(func.count(Order.id)).where(Order.order_status == OrderStatus.completed)) or 0
    )
    revenue_raw = await db.scalar(
        select(func.coalesce(func.sum(Payment.amount), 0.0)).where(Payment.status == PaymentStatus.paid)
    )
    revenue = round(float(revenue_raw or 0.0), 2)

    orders_by_status = {item.value: 0 for item in OrderStatus}
    order_rows = await db.execute(select(Order.order_status, func.count(Order.id)).group_by(Order.order_status))
    for order_status, count_value in order_rows:
        orders_by_status[order_status.value] = int(count_value)

    payments_by_status = {item.value: 0 for item in PaymentStatus}
    payment_rows = await db.execute(select(Payment.status, func.count(Payment.id)).group_by(Payment.status))
    for payment_status, count_value in payment_rows:
        payments_by_status[payment_status.value] = int(count_value)

    top_rows = await db.execute(
        select(
            OrderItem.product_name_snapshot,
            func.coalesce(func.sum(OrderItem.quantity), 0),
            func.coalesce(func.sum(OrderItem.line_total), 0.0),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.payment_status == PaymentStatus.paid)
        .group_by(OrderItem.product_name_snapshot)
        .order_by(func.sum(OrderItem.line_total).desc())
        .limit(5)
    )
    top_products = [
        TopProductOut(product_name=name, units_sold=int(units), revenue=round(float(amount or 0.0), 2))
        for name, units, amount in top_rows
    ]
    monthly_rows = await db.execute(
        select(func.to_char(Order.created_at, "YYYY-MM"), func.count(Order.id))
        .group_by(func.to_char(Order.created_at, "YYYY-MM"))
        .order_by(func.to_char(Order.created_at, "YYYY-MM"))
    )
    monthly_orders = [MonthlyOrderOut(month=month, orders=int(count)) for month, count in monthly_rows]

    return ReportOut(
        total_orders=total_orders,
        paid_orders=paid_orders,
        pending_payments=pending_payments,
        cancelled_orders=cancelled_orders,
        total_customers=total_customers,
        completed_projects=completed_projects,
        revenue_paid=revenue,
        average_order_value=round(revenue / paid_orders, 2) if paid_orders else 0.0,
        orders_by_status=orders_by_status,
        payments_by_status=payments_by_status,
        monthly_orders=monthly_orders,
        top_products=top_products,
    )


@router.get("/messages", response_model=list[MessageOut])
async def list_messages(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[MessageOut]:
    result = await db.scalars(
        select(CustomerMessage)
        .options(selectinload(CustomerMessage.user))
        .order_by(CustomerMessage.created_at.desc())
        .offset(skip)
        .limit(limit)
    )
    return [_message_out(message) for message in result.unique()]


@router.post("/messages/{message_id}/reply", response_model=MessageOut, dependencies=[Depends(csrf_guard)])
async def reply_to_message(
    message_id: str,
    payload: AdminMessageReplyIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> MessageOut:
    result = await db.scalars(
        select(CustomerMessage)
        .where(CustomerMessage.id == message_id)
        .options(selectinload(CustomerMessage.user))
        .limit(1)
    )
    message = result.unique().first()
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Message not found")
    message.admin_reply = payload.reply
    message.status = payload.status
    order_service.log_admin_activity(
        db,
        admin,
        "message.replied",
        "message",
        message.id,
        {"status": payload.status.value},
        _client_ip(request),
    )
    await db.commit()
    return _message_out(message)


@router.get("/contact-messages", response_model=list[ContactOut])
async def list_contact_messages(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[ContactOut]:
    messages = await db.scalars(
        select(ContactMessage).order_by(ContactMessage.created_at.desc()).offset(skip).limit(limit)
    )
    return [ContactOut.model_validate(message) for message in messages]


@router.patch(
    "/contact-messages/{message_id}/status",
    response_model=ContactOut,
    dependencies=[Depends(csrf_guard)],
)
async def update_contact_message_status(
    message_id: str,
    payload: AdminMessageStatusIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> ContactOut:
    message = await db.scalar(select(ContactMessage).where(ContactMessage.id == message_id).limit(1))
    if message is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Contact message not found")
    message.status = payload.status
    order_service.log_admin_activity(
        db,
        admin,
        "contact_message.status_updated",
        "contact_message",
        message.id,
        {"status": payload.status.value},
        _client_ip(request),
    )
    await db.commit()
    await db.refresh(message)
    return ContactOut.model_validate(message)


@router.get("/inquiries", response_model=list[InquiryOut])
async def list_inquiries(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=50, ge=1, le=200),
) -> list[InquiryOut]:
    inquiries = await db.scalars(
        select(ProjectInquiry).order_by(ProjectInquiry.created_at.desc()).offset(skip).limit(limit)
    )
    return [InquiryOut.model_validate(inquiry) for inquiry in inquiries]


@router.patch(
    "/inquiries/{inquiry_id}/status",
    response_model=InquiryOut,
    dependencies=[Depends(csrf_guard)],
)
async def update_inquiry_status(
    inquiry_id: str,
    payload: AdminMessageStatusIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> InquiryOut:
    inquiry = await db.scalar(select(ProjectInquiry).where(ProjectInquiry.id == inquiry_id).limit(1))
    if inquiry is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Inquiry not found")
    inquiry.status = payload.status
    order_service.log_admin_activity(
        db,
        admin,
        "inquiry.status_updated",
        "inquiry",
        inquiry.id,
        {"status": payload.status.value},
        _client_ip(request),
    )
    await db.commit()
    await db.refresh(inquiry)
    return InquiryOut.model_validate(inquiry)


@router.get("/payments", response_model=list[PaymentOut])
async def list_admin_payments(
    db: DbSession,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=100, ge=1, le=300),
) -> list[PaymentOut]:
    payments = await db.scalars(select(Payment).order_by(Payment.created_at.desc()).offset(skip).limit(limit))
    return [PaymentOut.model_validate(payment) for payment in payments]


@router.get("/settings", response_model=list[SiteSettingOut])
async def list_site_settings(db: DbSession) -> list[SiteSettingOut]:
    settings = await db.scalars(select(SiteSetting).order_by(SiteSetting.key))
    return [SiteSettingOut.model_validate(item) for item in settings]


@router.put("/settings/{key}", response_model=SiteSettingOut, dependencies=[Depends(csrf_guard)])
async def save_site_setting(
    key: str,
    payload: SiteSettingIn,
    request: Request,
    db: DbSession,
    admin: AdminUser,
) -> SiteSettingOut:
    result = await db.scalar(select(SiteSetting).where(SiteSetting.key == key))
    setting = result or SiteSetting(key=key)
    setting.value = payload.value
    setting.description = payload.description
    order_service.log_admin_activity(
        db,
        admin,
        "site_setting.updated",
        "site_setting",
        key,
        {"description": payload.description},
        _client_ip(request),
    )
    db.add(setting)
    await db.commit()
    await db.refresh(setting)
    return SiteSettingOut.model_validate(setting)
