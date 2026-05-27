"""JWT + bcrypt password hashing.

This module is intentionally framework-agnostic so it can be reused by
Celery workers and CLI scripts that don't import FastAPI.
"""

from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
import uuid

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import Settings

ALGORITHM = "HS256"
_pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return _pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd_context.verify(plain, hashed)


@dataclass(frozen=True)
class AuthPrincipal:
    """Decoded JWT claims that callers can rely on."""

    user_id: uuid.UUID
    email: str
    role: str
    jti: str | None = None


def create_access_token(
    settings: Settings,
    *,
    user_id: uuid.UUID,
    email: str,
    role: str,
    expires_minutes: int | None = None,
) -> str:
    """Issue a signed JWT bearer token."""
    ttl = expires_minutes if expires_minutes is not None else settings.auth_access_token_ttl_minutes
    now = datetime.now(tz=timezone.utc)
    payload = {
        "sub": str(user_id),
        "email": email,
        "role": role,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=ttl)).timestamp()),
        "jti": uuid.uuid4().hex,
    }
    return jwt.encode(payload, settings.secret_key, algorithm=ALGORITHM)


def decode_access_token(settings: Settings, token: str) -> AuthPrincipal:
    """Validate signature + expiry and return a structured principal.

    Raises ``ValueError`` on any failure — callers translate to HTTP 401.
    """
    try:
        claims = jwt.decode(token, settings.secret_key, algorithms=[ALGORITHM])
    except JWTError as exc:
        raise ValueError("invalid_or_expired_token") from exc

    try:
        user_id = uuid.UUID(claims["sub"])
    except (KeyError, ValueError) as exc:
        raise ValueError("malformed_subject_claim") from exc

    return AuthPrincipal(
        user_id=user_id,
        email=claims.get("email", ""),
        role=claims.get("role", "user"),
        jti=claims.get("jti"),
    )
