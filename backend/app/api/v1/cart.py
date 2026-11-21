from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user
from app.database.connection import get_db
from app.models import User
from app.schemas.commerce import CartAddIn, CartOut, CartUpdateIn
from app.services import cart_service

try:
    from app.core.security import verify_csrf_token as csrf_guard
except ImportError:

    async def csrf_guard() -> None:
        return None


router = APIRouter(prefix="/cart", tags=["cart"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("", response_model=CartOut)
async def get_cart(db: DbSession, user: Annotated[User, Depends(get_current_user)]) -> CartOut:
    cart = await cart_service.get_or_create_cart(db, user.id)
    return cart_service.build_cart_out(cart)


@router.post(
    "/items",
    response_model=CartOut,
    dependencies=[Depends(csrf_guard)],
)
async def add_cart_item(
    payload: CartAddIn,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> CartOut:
    cart = await cart_service.add_item(db, user.id, payload.product_id, payload.quantity)
    return cart_service.build_cart_out(cart)


@router.put(
    "/items/{item_id}",
    response_model=CartOut,
    dependencies=[Depends(csrf_guard)],
)
async def update_cart_item(
    item_id: str,
    payload: CartUpdateIn,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> CartOut:
    cart = await cart_service.update_item(db, user.id, item_id, payload.quantity)
    return cart_service.build_cart_out(cart)


@router.delete(
    "/items/{item_id}",
    response_model=CartOut,
    dependencies=[Depends(csrf_guard)],
)
async def remove_cart_item(
    item_id: str,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> CartOut:
    cart = await cart_service.remove_item(db, user.id, item_id)
    return cart_service.build_cart_out(cart)
