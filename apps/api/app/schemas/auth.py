"""Auth request / response schemas.

Email fields use ``str`` not ``EmailStr`` so we accept dev/internal TLDs like
``ragstudio.local`` and ``ragstudio.test`` that RFC 6761/6762 reserves and that
``email-validator`` rejects by default. DB uniqueness + the explicit ``@``
sanity check is the real guard.
"""

import uuid

from pydantic import BaseModel, Field, field_validator


def _looks_like_email(value: str) -> str:
    value = value.strip()
    if "@" not in value or len(value) < 3:
        raise ValueError("Not a valid email address")
    local, _, domain = value.rpartition("@")
    if not local or not domain or "." not in domain:
        raise ValueError("Not a valid email address")
    return value.lower()


class LoginRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=1)

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: str) -> str:
        return _looks_like_email(v)


class RegisterRequest(BaseModel):
    email: str = Field(min_length=3, max_length=255)
    password: str = Field(min_length=8, max_length=128)
    name: str | None = Field(default=None, max_length=255)

    @field_validator("email")
    @classmethod
    def _check_email(cls, v: str) -> str:
        return _looks_like_email(v)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int  # seconds


class CurrentUserResponse(BaseModel):
    id: uuid.UUID
    email: str
    name: str | None
    role: str
