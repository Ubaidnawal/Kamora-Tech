from __future__ import annotations

import logging
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.rate_limit import limiter
from app.core.security import (
    REFRESH_TOKEN_COOKIE,
    TOKEN_TYPE_ACCESS,
    clear_auth_cookies,
    decode_token,
    get_current_user,
    set_auth_cookies,
    token_from_request,
    verify_csrf_token,
)
from app.database.connection import (
    DatabaseConfigurationError,
    get_db,
    require_database_configured,
)
from app.models import User
from app.schemas.auth import (
    ForgotIn,
    LoginIn,
    MessageOut,
    ProfileOut,
    RefreshIn,
    RegisterIn,
    ResetIn,
    TokenOut,
    VerifyEmailIn,
    profile_from_user,
)
from app.services.auth_service import (
    FORGOT_PASSWORD_MESSAGE,
    get_profile,
    login_user,
    refresh_tokens,
    register_user,
)
from app.services.auth_service import (
    forgot_password as forgot_password_service,
)
from app.services.auth_service import (
    logout as logout_service,
)
from app.services.auth_service import (
    reset_password as reset_password_service,
)
from app.services.auth_service import (
    verify_email as verify_email_service,
)
from app.utils.email import (
    send_password_reset_email,
    send_verification_email,
    smtp_configured,
)

router = APIRouter(prefix="/auth", tags=["auth"])
logger = logging.getLogger("kamora.auth")

REGISTRATION_UNAVAILABLE_DETAIL = "Registration is temporarily unavailable. Please try again later."
AUTHENTICATION_UNAVAILABLE_DETAIL = "Authentication is temporarily unavailable."
DUPLICATE_EMAIL_DETAIL = "This email is already registered."

DbSession = Annotated[AsyncSession, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]


def _log_db_event(request: Request, category: str, exception_type: str) -> None:
    logger.error(
        "Authentication database event request_id=%s endpoint=%s category=%s exception_type=%s",
        getattr(request.state, "request_id", "-"),
        request.url.path,
        category,
        exception_type,
    )


def _is_cookie_flow(payload: RefreshIn | None) -> bool:
    return payload is None or not bool(payload.refresh_token)


def _resolve_refresh_token(payload: RefreshIn | None, request: Request) -> str | None:
    if payload is not None and payload.refresh_token:
        return payload.refresh_token
    return request.cookies.get(REFRESH_TOKEN_COOKIE)


@router.post("/register", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
async def register(request: Request, payload: RegisterIn, db: DbSession) -> MessageOut:
    try:
        require_database_configured()
    except DatabaseConfigurationError as exc:
        _log_db_event(request, "database_configuration", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=REGISTRATION_UNAVAILABLE_DETAIL,
        ) from exc

    try:
        user, raw_token = await register_user(db, payload)
    except HTTPException as exc:
        if exc.status_code == status.HTTP_409_CONFLICT:
            _log_db_event(request, "duplicate_email", type(exc).__name__)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=DUPLICATE_EMAIL_DETAIL,
            ) from exc
        raise
    except IntegrityError as exc:
        _log_db_event(request, "duplicate_email", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=DUPLICATE_EMAIL_DETAIL,
        ) from exc
    except (SQLAlchemyError, OSError) as exc:
        _log_db_event(request, "database_unavailable", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=REGISTRATION_UNAVAILABLE_DETAIL,
        ) from exc

    link = await send_verification_email(str(user.email), raw_token)

    if not smtp_configured():
        return MessageOut(
            message="Your account has been created successfully. Verify your email to activate your account.",
            token=raw_token,
            link=link,
        )
    return MessageOut(message="Your account has been created successfully. Please check your email to verify your account.")


@router.post("/login", response_model=TokenOut)
@limiter.limit("10/minute")
async def login(
    payload: LoginIn,
    request: Request,
    response: Response,
    db: DbSession,
) -> TokenOut:
    try:
        require_database_configured()
    except DatabaseConfigurationError as exc:
        _log_db_event(request, "database_configuration", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=AUTHENTICATION_UNAVAILABLE_DETAIL,
        ) from exc

    user_agent = request.headers.get("user-agent")
    ip_address = request.client.host if request.client else None
    try:
        tokens, user = await login_user(db, payload, user_agent=user_agent, ip_address=ip_address)
    except HTTPException:
        raise
    except (IntegrityError, SQLAlchemyError, OSError) as exc:
        _log_db_event(request, "database_unavailable", type(exc).__name__)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=AUTHENTICATION_UNAVAILABLE_DETAIL,
        ) from exc

    set_auth_cookies(
        response,
        tokens["access_token"],
        tokens["refresh_token"],
        tokens["csrf_token"],
        tokens["refresh_expires_in"],
    )
    return TokenOut(**tokens, user=profile_from_user(user))


@router.post("/refresh", response_model=TokenOut)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    db: DbSession,
    payload: RefreshIn | None = None,
) -> TokenOut:
    if _is_cookie_flow(payload):
        await verify_csrf_token(request)

    raw_token = _resolve_refresh_token(payload, request)
    if not raw_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token is required")

    tokens = await refresh_tokens(db, raw_token)
    user_id = str(decode_token(tokens["access_token"], TOKEN_TYPE_ACCESS)["sub"])
    user = await get_profile(db, user_id)

    set_auth_cookies(
        response,
        tokens["access_token"],
        tokens["refresh_token"],
        tokens["csrf_token"],
        tokens["refresh_expires_in"],
    )
    return TokenOut(**tokens, user=profile_from_user(user))


@router.post("/logout", response_model=MessageOut)
@limiter.limit("30/minute")
async def logout(
    request: Request,
    response: Response,
    db: DbSession,
    payload: RefreshIn | None = None,
) -> MessageOut:
    if _is_cookie_flow(payload):
        await verify_csrf_token(request)

    await logout_service(db, _resolve_refresh_token(payload, request))
    clear_auth_cookies(response)
    return MessageOut(message="Logged out successfully.")


@router.post("/forgot-password", response_model=MessageOut)
@limiter.limit("5/minute")
async def forgot_password(
    request: Request,
    payload: ForgotIn,
    db: DbSession,
) -> MessageOut:
    raw_token, link = await forgot_password_service(db, payload.email)
    if raw_token:
        await send_password_reset_email(str(payload.email), raw_token)

    if raw_token and not smtp_configured():
        return MessageOut(message=FORGOT_PASSWORD_MESSAGE, token=raw_token, link=link)
    return MessageOut(message=FORGOT_PASSWORD_MESSAGE)


@router.post("/reset-password", response_model=MessageOut)
@limiter.limit("5/minute")
async def reset_password(request: Request, payload: ResetIn, db: DbSession) -> MessageOut:
    await reset_password_service(db, payload.token, payload.password)
    return MessageOut(message="Password reset successfully. You can now log in.")


@router.post("/verify-email", response_model=MessageOut)
@limiter.limit("10/minute")
async def verify_email(request: Request, payload: VerifyEmailIn, db: DbSession) -> MessageOut:
    await verify_email_service(db, payload.token)
    return MessageOut(message="Email verified successfully.")


@router.get("/session")
async def session(request: Request, db: DbSession) -> dict[str, object]:
    token = token_from_request(request)
    if token:
        try:
            payload = decode_token(token, TOKEN_TYPE_ACCESS)
            user = await get_profile(db, str(payload["sub"]))
            return {"authenticated": True, "has_refresh": bool(request.cookies.get(REFRESH_TOKEN_COOKIE)), "user": profile_from_user(user)}
        except HTTPException:
            pass
    return {"authenticated": False, "has_refresh": bool(request.cookies.get(REFRESH_TOKEN_COOKIE)), "user": None}


@router.get("/me", response_model=ProfileOut)
async def current_profile(current_user: CurrentUser) -> ProfileOut:
    return profile_from_user(current_user)
