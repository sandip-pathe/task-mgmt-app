from fastapi import APIRouter, Depends, Response
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.errors import api_error
from app.auth.deps import get_current_user
from app.core.config import get_settings
from app.core.security import create_access_token, hash_password, verify_password
from app.db.session import get_db
from app.models import User
from app.schemas.auth import AuthRequest, AuthResponse

router = APIRouter(prefix="/auth", tags=["auth"])
COOKIE_NAME = "access_token"


def set_auth_cookie(response: Response, token: str) -> None:
    settings = get_settings()
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        max_age=settings.jwt_expires_minutes * 60,
        path="/",
    )


@router.post("/signup", response_model=AuthResponse, status_code=201)
def signup(payload: AuthRequest, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.scalar(select(User).where(User.email == payload.email.lower()))
    if existing:
        raise api_error(409, "EMAIL_TAKEN", "An account already exists for that email")

    user = User(email=payload.email.lower(), password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)

    set_auth_cookie(response, create_access_token(user.id))
    return AuthResponse(user=user)


@router.post("/login", response_model=AuthResponse)
def login(payload: AuthRequest, response: Response, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email.lower()))
    if not user or not verify_password(payload.password, user.password_hash):
        raise api_error(401, "INVALID_CREDENTIALS", "Email or password is incorrect")

    set_auth_cookie(response, create_access_token(user.id))
    return AuthResponse(user=user)


@router.post("/logout", status_code=204)
def logout(response: Response) -> Response:
    settings = get_settings()
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=settings.cookie_secure,
        samesite=settings.cookie_samesite,
        path="/",
    )
    return response


@router.get("/me", response_model=AuthResponse)
def me(current_user: User = Depends(get_current_user)) -> AuthResponse:
    return AuthResponse(user=current_user)
