from __future__ import annotations

import secrets
from datetime import UTC, datetime, timedelta
from typing import TypedDict

from fastapi import HTTPException, status
from pydantic import EmailStr
from sqlalchemy import func, select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.core.security import (
    create_access_token,
    create_csrf_token,
    create_refresh_token,
    decode_token,
    hash_password,
    hash_token,
    verify_password,
)
from app.models import (
    CustomerProfile,
    EmailVerificationToken,
    PasswordResetToken,
    RefreshToken,
    Role,
    RoleName,
    User,
    UserStatus,
)
from app.schemas.auth import LoginIn, PasswordChangeIn, ProfileUpdateIn, RegisterIn
from app.utils.email import build_password_reset_link

settings = get_settings()

FORGOT_PASSWORD_MESSAGE = "If an account exists for that email, a password reset link has been sent."
PROFILE_FIELDS = {
    "company_name",
    "address_line1",
    "city",
    "country",
    "timezone",
    "avatar_url",
}


class AuthTokens(TypedDict):
    access_token: str
    refresh_token: str
    token_type: str
    expires_in: int
    refresh_expires_in: int
    csrf_token: str


def _db_now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


def _as_naive_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value
    return value.astimezone(UTC).replace(tzinfo=None)


def _truncate(value: str | None, length: int) -> str | None:
    return value[:length] if value else None


async def _get_user_by_id(session: AsyncSession, user_id: str) -> User:
    result = await session.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.roles))
        .where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return user


async def _get_or_create_customer_role(session: AsyncSession) -> Role:
    result = await session.execute(select(Role).where(Role.name == RoleName.customer))
    role = result.scalar_one_or_none()
    if role is not None:
        return role

    session.add(Role(name=RoleName.customer, description="Default customer role"))
    try:
        await session.flush()
    except IntegrityError:
        await session.rollback()
        result = await session.execute(select(Role).where(Role.name == RoleName.customer))
        role = result.scalar_one_or_none()
        if role is None:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Unable to initialize customer role",
            )
        return role

    result = await session.execute(select(Role).where(Role.name == RoleName.customer))
    role = result.scalar_one_or_none()
    if role is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Unable to initialize customer role",
        )
    return role


async def _issue_tokens(
    session: AsyncSession,
    user: User,
    remember_me: bool = False,
    user_agent: str | None = None,
    ip_address: str | None = None,
    commit: bool = True,
) -> AuthTokens:
    csrf_token = create_csrf_token()
    refresh_days = settings.REFRESH_TOKEN_EXPIRE_DAYS if remember_me else 1
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id), claims={"csrf": csrf_token})
    refresh_record = RefreshToken(
        user_id=str(user.id),
        token_hash=hash_token(refresh_token),
        expires_at=_db_now() + timedelta(days=refresh_days),
        user_agent=_truncate(user_agent, 255),
        ip_address=_truncate(ip_address, 64),
    )
    session.add(refresh_record)
    await session.flush()
    if commit:
        await session.commit()

    return AuthTokens(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        refresh_expires_in=refresh_days * 86400,
        csrf_token=csrf_token,
    )


async def register_user(session: AsyncSession, payload: RegisterIn) -> tuple[User, str]:
    email = str(payload.email).strip().lower()
    existing = await session.execute(select(User.id).where(func.lower(User.email) == email))
    if existing.first() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        )

    role = await _get_or_create_customer_role(session)
    user = User(
        full_name=payload.full_name.strip(),
        email=email,
        phone=payload.phone.strip(),
        password_hash=hash_password(payload.password),
        accepted_terms=payload.accept_terms,
    )
    user.roles.append(role)

    raw_token = secrets.token_urlsafe(32)
    verification = EmailVerificationToken(
        user=user,
        token_hash=hash_token(raw_token),
        expires_at=_db_now() + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS),
    )
    session.add_all([user, verification])

    try:
        await session.commit()
    except IntegrityError as exc:
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists",
        ) from exc

    await session.refresh(user)
    return user, raw_token


async def verify_email(session: AsyncSession, raw_token: str) -> User:
    token_hash = hash_token(raw_token)
    now = _db_now()
    result = await session.execute(
        select(EmailVerificationToken)
        .where(EmailVerificationToken.token_hash == token_hash)
        .with_for_update()
    )
    record = result.scalar_one_or_none()
    if (
        record is None
        or record.used_at is not None
        or _as_naive_utc(record.expires_at) <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token",
        )

    user = await _get_user_by_id(session, record.user_id)
    if record.new_email:
        new_email = str(record.new_email).strip().lower()
        duplicate = await session.execute(
            select(User.id).where(func.lower(User.email) == new_email, User.id != str(user.id))
        )
        if duplicate.first() is not None:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")
        user.email = new_email
        record.new_email = None
    user.is_verified = True
    record.used_at = now
    await session.execute(
        update(EmailVerificationToken)
        .where(
            EmailVerificationToken.user_id == str(user.id),
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.id != record.id,
        )
        .values(used_at=now)
    )
    await session.commit()
    await session.refresh(user)
    return user


async def login_user(
    session: AsyncSession,
    payload: LoginIn,
    user_agent: str | None = None,
    ip_address: str | None = None,
) -> tuple[AuthTokens, User]:
    email = str(payload.email).strip().lower()
    result = await session.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.roles))
        .where(func.lower(User.email) == email)
    )
    user = result.scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active or user.status != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive",
        )

    tokens = await _issue_tokens(
        session,
        user,
        remember_me=payload.remember_me,
        user_agent=user_agent,
        ip_address=ip_address,
    )
    return tokens, user


async def refresh_tokens(session: AsyncSession, raw_token: str | None) -> AuthTokens:
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token is required",
        )

    payload = decode_token(raw_token, expected_type="refresh")
    token_hash = hash_token(raw_token)
    now = _db_now()
    result = await session.execute(
        select(RefreshToken)
        .where(RefreshToken.token_hash == token_hash)
        .with_for_update()
    )
    record = result.scalar_one_or_none()
    if (
        record is None
        or record.revoked_at is not None
        or _as_naive_utc(record.expires_at) <= now
        or str(payload.get("sub")) != record.user_id
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = await _get_user_by_id(session, record.user_id)
    if not user.is_active or user.status != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="This account is inactive",
        )

    new_tokens = await _issue_tokens(
        session,
        user,
        remember_me=True,
        user_agent=record.user_agent,
        ip_address=record.ip_address,
        commit=False,
    )
    record.revoked_at = now
    record.replaced_by = hash_token(new_tokens["refresh_token"])
    await session.commit()
    return new_tokens


async def logout(session: AsyncSession, raw_token: str | None) -> None:
    if not raw_token:
        return

    try:
        payload = decode_token(raw_token, expected_type="refresh")
    except HTTPException:
        return

    if not payload.get("sub"):
        return

    token_hash = hash_token(raw_token)
    result = await session.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    record = result.scalar_one_or_none()
    if record is not None and record.revoked_at is None:
        record.revoked_at = _db_now()
        await session.commit()


async def forgot_password(session: AsyncSession, email: EmailStr | str) -> tuple[str | None, str | None]:
    normalized_email = str(email).strip().lower()
    result = await session.execute(select(User).where(func.lower(User.email) == normalized_email))
    user = result.scalar_one_or_none()
    if user is None:
        return None, None

    raw_token = secrets.token_urlsafe(32)
    reset_record = PasswordResetToken(
        user_id=str(user.id),
        token_hash=hash_token(raw_token),
        expires_at=_db_now() + timedelta(minutes=settings.PASSWORD_RESET_EXPIRE_MINUTES),
    )
    session.add(reset_record)
    await session.commit()
    return raw_token, build_password_reset_link(raw_token)


async def reset_password(session: AsyncSession, raw_token: str, new_password: str) -> User:
    token_hash = hash_token(raw_token)
    now = _db_now()
    result = await session.execute(
        select(PasswordResetToken)
        .where(PasswordResetToken.token_hash == token_hash)
        .with_for_update()
    )
    record = result.scalar_one_or_none()
    if (
        record is None
        or record.used_at is not None
        or _as_naive_utc(record.expires_at) <= now
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token",
        )

    user = await _get_user_by_id(session, record.user_id)
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This account is inactive")

    user.password_hash = hash_password(new_password)
    record.used_at = now
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == str(user.id), RefreshToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    await session.commit()
    await session.refresh(user)
    return user


async def request_email_change(session: AsyncSession, user_id: str, new_email: str) -> tuple[str, str]:
    user = await _get_user_by_id(session, user_id)
    normalized = str(new_email).strip().lower()
    if normalized == str(user.email).strip().lower():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is unchanged")

    duplicate = await session.execute(select(User.id).where(func.lower(User.email) == normalized))
    if duplicate.first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Email is already in use")

    raw_token = secrets.token_urlsafe(32)
    verification = EmailVerificationToken(
        user_id=str(user.id),
        token_hash=hash_token(raw_token),
        new_email=normalized,
        expires_at=_db_now() + timedelta(hours=settings.VERIFICATION_TOKEN_EXPIRE_HOURS),
    )
    session.add(verification)
    await session.commit()
    from app.utils.email import build_verification_link

    return raw_token, build_verification_link(raw_token)


async def get_profile(session: AsyncSession, user_id: str) -> User:
    return await _get_user_by_id(session, user_id)


async def update_profile(session: AsyncSession, user_id: str, payload: ProfileUpdateIn) -> User:
    user = await _get_user_by_id(session, user_id)
    data = payload.model_dump(exclude_unset=True)
    profile_data = {key: data.pop(key) for key in list(data) if key in PROFILE_FIELDS}

    if "full_name" in data:
        user.full_name = data["full_name"]
    if "phone" in data:
        user.phone = data["phone"]

    if profile_data:
        if user.profile is None:
            user.profile = CustomerProfile(user_id=str(user.id), **profile_data)
        else:
            for field, value in profile_data.items():
                setattr(user.profile, field, value)

    await session.commit()
    await session.refresh(user)
    return user


async def change_password(session: AsyncSession, user_id: str, payload: PasswordChangeIn) -> User:
    user = await _get_user_by_id(session, user_id)
    if not verify_password(payload.current_password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Current password is incorrect")
    if verify_password(payload.new_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current password",
        )

    user.password_hash = hash_password(payload.new_password)
    now = _db_now()
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == str(user.id), RefreshToken.revoked_at.is_(None))
        .values(revoked_at=now)
    )
    await session.commit()
    await session.refresh(user)
    return user
