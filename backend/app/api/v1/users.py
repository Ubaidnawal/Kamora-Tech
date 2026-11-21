from __future__ import annotations

from typing import Annotated, Any

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import get_current_user, verify_csrf_token
from app.database.connection import get_db
from app.models import User
from app.schemas.auth import (
    EmailChangeIn,
    MessageOut,
    PasswordChangeIn,
    ProfileOut,
    ProfileUpdateIn,
    profile_from_user,
)
from app.services.auth_service import change_password, get_profile, request_email_change, update_profile
from app.utils.email import send_verification_email, smtp_configured

router = APIRouter(prefix="/users", tags=["users"])

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


@router.get("/me", response_model=ProfileOut)
async def read_me(current_user: CurrentUser) -> ProfileOut:
    return profile_from_user(current_user)


@router.patch("/me", response_model=ProfileOut)
async def patch_me(
    payload: ProfileUpdateIn,
    current_user: CurrentUser,
    db: DbSession,
) -> ProfileOut:
    updated_user = await update_profile(db, str(current_user.id), payload)
    return profile_from_user(updated_user)


@router.post("/me/change-password", response_model=MessageOut, dependencies=[Depends(verify_csrf_token)])
async def change_my_password(
    payload: PasswordChangeIn,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageOut:
    await change_password(db, str(current_user.id), payload)
    return MessageOut(message="Password changed successfully.")


@router.post("/me/email", response_model=MessageOut, dependencies=[Depends(verify_csrf_token)])
async def request_my_email_change(
    payload: EmailChangeIn,
    current_user: CurrentUser,
    db: DbSession,
) -> MessageOut:
    raw_token, link = await request_email_change(db, str(current_user.id), payload.new_email)
    await send_verification_email(payload.new_email, raw_token)
    if not smtp_configured():
        return MessageOut(
            message="Verification required. Confirm the new email to complete the change.",
            token=raw_token,
            link=link,
        )
    return MessageOut(message="Verification required. Check the new email to confirm the change.")


@router.get("/me/orders")
async def read_my_orders(
    current_user: CurrentUser,
    db: DbSession,
) -> dict[str, Any]:
    try:
        from app.api.v1.orders import list_my_orders
    except ImportError:
        return {"items": [], "message": "Order listing is provided by the commerce router."}
    return await list_my_orders(current_user, db)


@router.get("/me/profile", response_model=ProfileOut)
async def read_my_profile(
    current_user: CurrentUser,
    db: DbSession,
) -> ProfileOut:
    user = await get_profile(db, str(current_user.id))
    return profile_from_user(user)


@router.put("/me/profile", response_model=ProfileOut)
async def replace_my_profile(
    payload: ProfileUpdateIn,
    current_user: CurrentUser,
    db: DbSession,
) -> ProfileOut:
    updated_user = await update_profile(db, str(current_user.id), payload)
    return profile_from_user(updated_user)
