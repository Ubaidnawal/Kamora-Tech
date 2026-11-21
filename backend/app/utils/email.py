from __future__ import annotations

import asyncio
import logging
import smtplib
from email.message import EmailMessage
from urllib.parse import quote

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


def smtp_configured() -> bool:
    return bool(settings.SMTP_HOST.strip())


def _build_link(path: str, token: str) -> str:
    base_url = settings.FRONTEND_URL.rstrip("/")
    return f"{base_url}{path}?token={quote(token, safe='')}"


def build_verification_link(token: str) -> str:
    return _build_link("/verify-email", token)


def build_password_reset_link(token: str) -> str:
    return _build_link("/reset-password", token)


def _send_email(subject: str, recipient: str, body: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = settings.SMTP_FROM
    message["To"] = recipient
    message.set_content(body)

    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10) as server:
        server.starttls()
        if settings.SMTP_USER:
            server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        server.send_message(message)


async def send_verification_email(email: str, token: str) -> str | None:
    link = build_verification_link(token)
    if not smtp_configured():
        logger.info("Verification link for %s: %s", email, link)
        return link

    body = f"Verify your email address by visiting this link:\n\n{link}\n"
    await asyncio.to_thread(_send_email, "Verify your email address", email, body)
    return None


async def send_password_reset_email(email: str, token: str) -> str | None:
    link = build_password_reset_link(token)
    if not smtp_configured():
        logger.info("Password reset link for %s: %s", email, link)
        return link

    body = f"Reset your password by visiting this link:\n\n{link}\nThis link expires soon.\n"
    await asyncio.to_thread(_send_email, "Reset your password", email, body)
    return None
