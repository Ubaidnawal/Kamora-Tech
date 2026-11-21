from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_admin, get_current_user
from app.database.connection import get_db
from app.models import User
from app.schemas.commerce import AdminPaymentUpdateIn, PaymentOut
from app.services import order_service

try:
    from app.core.security import verify_csrf_token as csrf_guard
except ImportError:

    async def csrf_guard() -> None:
        return None


router = APIRouter(prefix="/payments", tags=["payments"])

DbSession = Annotated[AsyncSession, Depends(get_db)]


@router.get("/{order_id}", response_model=list[PaymentOut])
async def list_order_payments(
    order_id: str,
    db: DbSession,
    user: Annotated[User, Depends(get_current_user)],
) -> list[PaymentOut]:
    order = await order_service.get_user_order(db, user.id, order_id)
    if order is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return [PaymentOut.model_validate(payment) for payment in order.payments]


@router.post(
    "/{order_id}/record",
    response_model=PaymentOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(csrf_guard)],
)
async def record_order_payment(
    order_id: str,
    payload: AdminPaymentUpdateIn,
    db: DbSession,
    admin: Annotated[User, Depends(get_current_admin)],
) -> PaymentOut:
    payment = await order_service.record_payment(db, admin, order_id, payload)
    if payment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found")
    return PaymentOut.model_validate(payment)
