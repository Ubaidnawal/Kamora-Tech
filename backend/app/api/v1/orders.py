from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.core.security import get_current_user
from app.database.connection import get_db
from app.models import User
from app.schemas.commerce import CheckoutIn, GuestCheckoutIn, OrderOut, TrackOut
from app.services import order_service

try:
    from app.core.security import verify_csrf_token as csrf_guard
except ImportError:

    async def csrf_guard() -> None:
        return None

router = APIRouter(prefix="/orders", tags=["orders"])

DbSession = Annotated[AsyncSession, Depends(get_db)]

@router.post(
    "/guest",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
)
@limiter.limit("10/minute")
async def create_guest_order(
    request: Request,
    payload: GuestCheckoutIn,
    db: DbSession,
) -> OrderOut:
    try:
        order = await order_service.create_guest_order_from_items(db, payload)
    except SQLAlchemyError as exc:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Order could not be created right now. Please try again later.",
        ) from exc
    return OrderOut.model_validate(order)

@router.post(
    "",
    response_model=OrderOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_guard)],
)
async def create_order(
    payload: CheckoutIn,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> OrderOut:
    order = await order_service.create_order_from_cart(db, user, payload)
    return OrderOut.model_validate(order)

@router.get("", response_model=list[OrderOut])
async def list_orders(
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> list[OrderOut]:
    orders = await order_service.get_user_orders(db, user.id)
    return [OrderOut.model_validate(order) for order in orders]

@router.get("/track", response_model=TrackOut)
async def track_order_by_identifier(db: DbSession, identifier: str = Query(min_length=3, max_length=64)) -> TrackOut:
    result = await order_service.get_order_by_tracking_public(db, identifier)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order or tracking ID not found")
    return result

@router.get("/track/{tracking_id}", response_model=TrackOut)
async def track_order(db: DbSession, tracking_id: str) -> TrackOut:
    result = await order_service.get_order_by_tracking_public(db, tracking_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Tracking ID not found")
    return result

@router.get("/{order_id}", response_model=OrderOut)
async def get_order(
    order_id: str,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> OrderOut:
    order = await order_service.get_user_order(db, user.id, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return OrderOut.model_validate(order)
