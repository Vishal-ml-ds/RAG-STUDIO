"""Auth endpoints — register, login, current user."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from app.core.security.auth import (
    create_access_token,
    hash_password,
    verify_password,
)
from app.dependencies import AppSettings, CurrentPrincipal, DbSession
from app.models.user import User
from app.schemas.auth import (
    CurrentUserResponse,
    LoginRequest,
    RegisterRequest,
    TokenResponse,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post(
    "/register",
    status_code=status.HTTP_201_CREATED,
    response_model=CurrentUserResponse,
)
async def register(payload: RegisterRequest, db: DbSession) -> CurrentUserResponse:
    existing = await db.scalar(select(User).where(User.email == payload.email))
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered",
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        name=payload.name,
        role="user",
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
    )


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    db: DbSession,
    settings: AppSettings,
) -> TokenResponse:
    user = await db.scalar(select(User).where(User.email == payload.email))
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account disabled",
        )

    user.last_login = datetime.now(tz=timezone.utc)

    token = create_access_token(
        settings,
        user_id=user.id,
        email=user.email,
        role=user.role,
    )
    return TokenResponse(
        access_token=token,
        expires_in=settings.auth_access_token_ttl_minutes * 60,
    )


@router.get("/me", response_model=CurrentUserResponse)
async def me(principal: CurrentPrincipal, db: DbSession) -> CurrentUserResponse:
    user = await db.scalar(select(User).where(User.id == principal.user_id))
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return CurrentUserResponse(
        id=user.id,
        email=user.email,
        name=user.name,
        role=user.role,
    )
