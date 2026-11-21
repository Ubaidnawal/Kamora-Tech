from __future__ import annotations

import re
from datetime import datetime
from typing import Any, cast

from pydantic import (
    AliasChoices,
    BaseModel,
    ConfigDict,
    EmailStr,
    Field,
    field_validator,
    model_validator,
)


def _validate_password_strength(value: str) -> str:
    if len(value) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", value):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", value):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", value):
        raise ValueError("Password must contain at least one digit")
    return value


def _validate_phone(value: str) -> str:
    if len(re.sub(r"\D", "", value)) < 7:
        raise ValueError("Phone number must contain at least 7 digits")
    return value


def _normalize_email(value: EmailStr | str) -> EmailStr:
    return cast(EmailStr, str(value).strip().lower())


def _normalize_role_name(role: Any) -> str:
    name = getattr(role, "name", role)
    return str(getattr(name, "value", name)).strip().lower()


class ProfileOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    full_name: str
    email: EmailStr
    phone: str
    is_active: bool
    is_verified: bool
    roles: list[str] = Field(default_factory=list)
    company_name: str | None = None
    address_line1: str | None = None
    city: str | None = None
    country: str | None = None
    timezone: str | None = None
    avatar_url: str | None = None
    created_at: datetime | None = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return _normalize_email(value)

    @field_validator("roles", mode="before")
    @classmethod
    def convert_roles(cls, value: Any) -> list[str]:
        if value is None:
            return []
        return [_normalize_role_name(role) for role in value]


def profile_from_user(user: Any) -> ProfileOut:
    profile = getattr(user, "profile", None)
    return ProfileOut(
        id=str(user.id),
        full_name=str(user.full_name),
        email=_normalize_email(user.email),
        phone=str(user.phone),
        is_active=bool(user.is_active),
        is_verified=bool(user.is_verified),
        roles=[_normalize_role_name(role) for role in getattr(user, "roles", [])],
        company_name=getattr(profile, "company_name", None),
        address_line1=getattr(profile, "address_line1", None),
        city=getattr(profile, "city", None),
        country=getattr(profile, "country", None),
        timezone=getattr(profile, "timezone", None),
        avatar_url=getattr(profile, "avatar_url", None),
        created_at=getattr(user, "created_at", None),
    )


class ProfileUpdateIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    full_name: str | None = Field(default=None, min_length=1, max_length=160)
    phone: str | None = Field(default=None, min_length=7, max_length=32)
    company_name: str | None = Field(default=None, max_length=160)
    address_line1: str | None = Field(default=None, max_length=255)
    city: str | None = Field(default=None, max_length=120)
    country: str | None = Field(default=None, max_length=120)
    timezone: str | None = Field(default=None, max_length=80)
    avatar_url: str | None = Field(default=None, max_length=500)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return None if value is None else _validate_phone(value)


class EmailChangeIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    new_email: EmailStr

    @field_validator("new_email")
    @classmethod
    def normalize_new_email(cls, value: EmailStr) -> EmailStr:
        return _normalize_email(value)


class PasswordChangeIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    current_password: str = Field(min_length=1, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_new_password(cls, value: str) -> str:
        return _validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> PasswordChangeIn:
        if self.new_password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class RegisterIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    full_name: str = Field(min_length=1, max_length=160)
    email: EmailStr
    phone: str = Field(min_length=7, max_length=32, validation_alias=AliasChoices("phone", "phone_number"))
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)
    accept_terms: bool

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return _normalize_email(value)

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return _validate_phone(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)

    @model_validator(mode="after")
    def validate_registration(self) -> RegisterIn:
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        if not self.accept_terms:
            raise ValueError("You must accept the terms and conditions")
        return self


class LoginIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    email: EmailStr
    password: str = Field(min_length=1, max_length=128)
    remember_me: bool = False

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return _normalize_email(value)


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    refresh_token: str | None = None
    refresh_expires_in: int | None = None
    csrf_token: str | None = None
    user: ProfileOut | None = None


class RefreshIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    refresh_token: str | None = None


class ForgotIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    email: EmailStr

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: EmailStr) -> EmailStr:
        return _normalize_email(value)


class ResetIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    token: str = Field(min_length=1)
    password: str = Field(min_length=8, max_length=128)
    confirm_password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return _validate_password_strength(value)

    @model_validator(mode="after")
    def passwords_match(self) -> ResetIn:
        if self.password != self.confirm_password:
            raise ValueError("Passwords do not match")
        return self


class VerifyEmailIn(BaseModel):
    model_config = ConfigDict(extra="forbid", str_strip_whitespace=True)

    token: str = Field(min_length=1)


class MessageOut(BaseModel):
    message: str
    token: str | None = None
    link: str | None = None
