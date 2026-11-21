from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models import Cart, CartItem, CartStatus, Product
from app.schemas.commerce import CartItemOut, CartOut, ProductOut
from app.services.catalog_service import get_purchasable_product

MAX_QUANTITY = 100


def _cart_options() -> tuple:
    return (
        selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.images),
        selectinload(Cart.items).selectinload(CartItem.product).selectinload(Product.category),
    )


async def _load_cart(db: AsyncSession, cart_id: str) -> Cart | None:
    result = await db.scalars(select(Cart).where(Cart.id == cart_id).options(*_cart_options()))
    return result.unique().first()


async def get_cart(db: AsyncSession, user_id: str) -> Cart | None:
    result = await db.scalars(select(Cart).where(Cart.user_id == user_id).options(*_cart_options()))
    return result.unique().first()


async def get_or_create_cart(db: AsyncSession, user_id: str) -> Cart:
    cart = await get_cart(db, user_id)
    if cart is None:
        cart = Cart(user_id=user_id, status=CartStatus.active)
        db.add(cart)
    elif cart.status != CartStatus.active:
        cart.status = CartStatus.active
    await db.commit()
    await db.refresh(cart, ["items"])
    return await _load_cart(db, cart.id) or cart


async def add_item(db: AsyncSession, user_id: str, product_id: str, quantity: int) -> Cart:
    if not product_id or not product_id.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid product identifier")
    if quantity < 1 or quantity > MAX_QUANTITY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quantity must be between 1 and {MAX_QUANTITY}",
        )

    product = await get_purchasable_product(db, product_id)
    if product is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found or unavailable")

    cart = await get_or_create_cart(db, user_id)
    existing = next((item for item in cart.items if item.product_id == product.id), None)
    if existing is not None:
        new_quantity = existing.quantity + quantity
        if new_quantity > MAX_QUANTITY:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Maximum quantity per product is {MAX_QUANTITY}",
            )
        existing.quantity = new_quantity
    else:
        db.add(CartItem(cart_id=cart.id, product_id=product.id, quantity=quantity))

    await db.commit()
    await db.refresh(cart, ["items"])
    return await _load_cart(db, cart.id) or cart


async def update_item(db: AsyncSession, user_id: str, item_id: str, quantity: int) -> Cart:
    if quantity < 1 or quantity > MAX_QUANTITY:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quantity must be between 1 and {MAX_QUANTITY}",
        )

    cart = await get_or_create_cart(db, user_id)
    item = next((entry for entry in cart.items if entry.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    item.quantity = quantity
    await db.commit()
    await db.refresh(cart, ["items"])
    return await _load_cart(db, cart.id) or cart


async def remove_item(db: AsyncSession, user_id: str, item_id: str) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    item = next((entry for entry in cart.items if entry.id == item_id), None)
    if item is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cart item not found")
    cart.items.remove(item)
    await db.delete(item)
    await db.commit()
    await db.refresh(cart, ["items"])
    return await _load_cart(db, cart.id) or cart


async def clear_cart(db: AsyncSession, user_id: str) -> Cart:
    cart = await get_or_create_cart(db, user_id)
    items = list(cart.items)
    cart.items.clear()
    for item in items:
        await db.delete(item)
    await db.commit()
    await db.refresh(cart, ["items"])
    return await _load_cart(db, cart.id) or cart


def cart_total(cart: Cart) -> float | None:
    total = 0.0
    for item in cart.items:
        price = item.product.price if item.product is not None else None
        if price is None:
            return None
        total += float(price) * item.quantity
    return round(total, 2)


def cart_currency(cart: Cart) -> str:
    for item in cart.items:
        if item.product is not None and item.product.currency:
            return item.product.currency
    return "USD"


def build_cart_out(cart: Cart) -> CartOut:
    items: list[CartItemOut] = []
    for item in cart.items:
        price = float(item.product.price) if item.product is not None and item.product.price is not None else None
        items.append(
            CartItemOut(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=price,
                line_total=round(price * item.quantity, 2) if price is not None else None,
                product=ProductOut.model_validate(item.product) if item.product is not None else None,
            )
        )
    return CartOut(
        id=cart.id,
        status=cart.status,
        items=items,
        item_count=sum(item.quantity for item in cart.items),
        total=cart_total(cart),
        currency=cart_currency(cart),
    )
