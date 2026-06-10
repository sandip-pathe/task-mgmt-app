from fastapi import Cookie, Depends
from sqlalchemy.orm import Session

from app.api.errors import api_error
from app.core.security import decode_access_token
from app.db.session import get_db
from app.models import User


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:
    if not access_token:
        raise api_error(401, "UNAUTHORIZED", "Authentication required")

    user_id = decode_access_token(access_token)
    if not user_id:
        raise api_error(401, "UNAUTHORIZED", "Invalid or expired session")

    user = db.get(User, user_id)
    if not user:
        raise api_error(401, "UNAUTHORIZED", "Invalid or expired session")

    return user
