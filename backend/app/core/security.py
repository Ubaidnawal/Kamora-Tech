from __future__ import annotations

import hashlib
import secrets
from collections.abc import Awaitable, Callable
from datetime import UTC, datetime, timedelta
from typing import Annotated, Any

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError, VerifyMismatchError
from fastapi import Depends, HTTPException, Request, Response, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import get_settings
from app.database.connection import get_db
from app.models import RoleName, User, UserStatus

settings = get_settings()

ACCESS_TOKEN_COOKIE = "access_token"
REFRESH_TOKEN_COOKIE = "refresh_token"
CSRF_TOKEN_COOKIE = "csrf_token"
CSRF_HEADER = "X-CSRF-Token"
TOKEN_TYPE_ACCESS = "access"
TOKEN_TYPE_REFRESH = "refresh"

_password_hasher = PasswordHasher()

DbSession = Annotated[AsyncSession, Depends(get_db)]


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return _password_hasher.verify(hashed_password, plain_password)
    except (VerifyMismatchError, VerificationError, InvalidHashError):
        return False


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_csrf_token() -> str:
    return secrets.token_urlsafe(32)


def _create_token(
    subject: str,
    token_type: str,
    expires_delta: timedelta,
    claims: dict[str, Any] | None = None,
) -> str:
    now = datetime.now(UTC)
    payload: dict[str, Any] = dict(claims or {})
    payload.update(
        {
            "sub": subject,
            "type": token_type,
            "iat": now,
            "exp": now + expires_delta,
            "jti": secrets.token_urlsafe(16),
        }
    )
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def create_access_token(
    subject: str,
    expires_delta: timedelta | None = None,
    claims: dict[str, Any] | None = None,
) -> str:
    delta = expires_delta if expires_delta is not None else timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return _create_token(subject, TOKEN_TYPE_ACCESS, delta, claims)


def create_refresh_token(
    subject: str,
    expires_delta: timedelta | None = None,
    claims: dict[str, Any] | None = None,
) -> str:
    delta = expires_delta if expires_delta is not None else timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    return _create_token(subject, TOKEN_TYPE_REFRESH, delta, claims)


def decode_token(token: str, expected_type: str | None = None) -> dict[str, Any]:
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
    except JWTError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token") from exc

    if expected_type is not None and payload.get("type") != expected_type:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
    if not payload.get("sub"):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")
    return payload


def token_from_request(request: Request) -> str | None:
    authorization = request.headers.get("authorization", "")
    if authorization.lower().startswith("bearer "):
        token = authorization.split(" ", 1)[1].strip()
        if token:
            return token
    return request.cookies.get(ACCESS_TOKEN_COOKIE)


async def get_current_user(request: Request, session: DbSession) -> User:
    token = token_from_request(request)
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    payload = decode_token(token, TOKEN_TYPE_ACCESS)
    result = await session.execute(
        select(User)
        .options(selectinload(User.profile), selectinload(User.roles))
        .where(User.id == str(payload["sub"]))
    )
    user = result.scalar_one_or_none()
    if user is None or not user.is_active or user.status != UserStatus.active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User account is unavailable")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def _normalize_role_name(role: str | RoleName) -> str:
    value = role.value if isinstance(role, RoleName) else str(role)
    return value.strip().lower()


def require_roles(*roles: str | RoleName) -> Callable[..., Awaitable[User]]:
    allowed_roles = {_normalize_role_name(role) for role in roles}

    async def role_checker(user: CurrentUser) -> User:
        user_roles = {_normalize_role_name(role.name) for role in user.roles}
        if not allowed_roles.intersection(user_roles):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Insufficient permissions")
        return user

    return role_checker


AdminUser = Annotated[User, Depends(require_roles(RoleName.admin))]


async def get_current_admin(user: AdminUser) -> User:
    return user


def set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str,
    csrf_token: str,
    refresh_max_age: int | None = None,
) -> None:
    refresh_age = refresh_max_age if refresh_max_age is not None else settings.REFRESH_TOKEN_EXPIRE_DAYS * 86400
    response.set_cookie(
        ACCESS_TOKEN_COOKIE,
        access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        REFRESH_TOKEN_COOKIE,
        refresh_token,
        max_age=refresh_age,
        httponly=True,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )
    response.set_cookie(
        CSRF_TOKEN_COOKIE,
        csrf_token,
        max_age=refresh_age,
        httponly=False,
        secure=settings.is_production,
        samesite="lax",
        path="/",
    )


def clear_auth_cookies(response: Response) -> None:
    response.delete_cookie(
        ACCESS_TOKEN_COOKIE,
        path="/",
        secure=settings.is_production,
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        REFRESH_TOKEN_COOKIE,
        path="/",
        secure=settings.is_production,
        httponly=True,
        samesite="lax",
    )
    response.delete_cookie(
        CSRF_TOKEN_COOKIE,
        path="/",
        secure=settings.is_production,
        httponly=False,
        samesite="lax",
    )


async def verify_csrf_token(request: Request) -> None:
    cookie_token = request.cookies.get(CSRF_TOKEN_COOKIE)
    header_token = request.headers.get(CSRF_HEADER)
    if not cookie_token or not header_token or not secrets.compare_digest(cookie_token, header_token):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="CSRF token missing or invalid")
