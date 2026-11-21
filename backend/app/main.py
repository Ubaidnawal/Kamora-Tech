import logging
import uuid
from importlib import import_module
from importlib.util import find_spec
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from sqlalchemy.exc import IntegrityError, SQLAlchemyError

from app.core.config import get_settings
from app.core.rate_limit import limiter
from app.database.connection import (
    DatabaseConfigurationError,
    require_database_configured,
    verify_database_connection,
)

logger = logging.getLogger("kamora")
settings = get_settings()

REGISTRATION_UNAVAILABLE_DETAIL = "Registration is temporarily unavailable. Please try again later."
AUTHENTICATION_UNAVAILABLE_DETAIL = "Authentication is temporarily unavailable."
DUPLICATE_EMAIL_DETAIL = "This email is already registered."


def exception_category(exc: Exception) -> str:
    if isinstance(exc, DatabaseConfigurationError):
        return "database_configuration"
    if isinstance(exc, IntegrityError):
        return "duplicate_email"
    if isinstance(exc, (SQLAlchemyError, OSError)):
        return "database_unavailable"
    return "unhandled_error"

app = FastAPI(title="Kamora Tech API", version="1.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_context(request: Request, call_next):
    request_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.request_id = request_id
    response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "detail": "Request validation failed.",
            "errors": jsonable_encoder(exc.errors()),
        },
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = getattr(request.state, "request_id", "-")
    category = exception_category(exc)
    logger.error(
        "Unhandled API error request_id=%s endpoint=%s category=%s exception_type=%s",
        request_id,
        request.url.path,
        category,
        type(exc).__name__,
    )
    headers: dict[str, str] = {"X-Request-ID": request_id}
    origin = request.headers.get("origin")
    if origin in settings.cors_origins:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
        headers["Vary"] = "Origin"
    path = request.url.path
    is_db_error = category in {"database_configuration", "database_unavailable"}
    if path.endswith("/register") and isinstance(exc, IntegrityError):
        status_code = 409
        detail = DUPLICATE_EMAIL_DETAIL
    elif path.endswith("/register") and is_db_error:
        status_code = 503
        detail = REGISTRATION_UNAVAILABLE_DETAIL
    elif "/auth/" in path and is_db_error:
        status_code = 503
        detail = AUTHENTICATION_UNAVAILABLE_DETAIL
    else:
        status_code = 500
        detail = "The server could not complete the request."
    return JSONResponse(
        status_code=status_code,
        content={"error": "server_error", "category": category, "detail": detail},
        headers=headers,
    )


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/health/db")
async def database_health(request: Request) -> JSONResponse:
    try:
        require_database_configured()
        await verify_database_connection()
        return JSONResponse(status_code=200, content={"status": "ok", "detail": "Database connection verified."})
    except (DatabaseConfigurationError, SQLAlchemyError, OSError) as exc:
        logger.error(
            "Database health check failed request_id=%s endpoint=%s category=%s",
            getattr(request.state, "request_id", "-"),
            request.url.path,
            exception_category(exc),
        )
        return JSONResponse(status_code=503, content={"status": "error", "detail": "Database unavailable."})


upload_directory = Path(settings.UPLOAD_DIR)
upload_directory.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=upload_directory), name="uploads")


_ROUTER_MODULES = (
    "app.api.v1.auth",
    "app.api.v1.users",
    "app.api.v1.contact",
    "app.api.v1.products",
    "app.api.v1.cart",
    "app.api.v1.orders",
    "app.api.v1.payments",
    "app.api.v1.admin",
)


def _include_available_routers() -> None:
    for module_name in _ROUTER_MODULES:
        if find_spec(module_name) is None:
            continue
        module = import_module(module_name)
        router = getattr(module, "router", None)
        if router is not None:
            app.include_router(router, prefix="/api/v1")


_include_available_routers()
