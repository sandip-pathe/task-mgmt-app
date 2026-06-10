from functools import lru_cache

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/rival_tasks"
    )
    jwt_secret: str = Field(default="dev-only-change-me-with-at-least-32-bytes")
    jwt_expires_minutes: int = Field(default=60 * 24 * 7)
    frontend_origin: AnyHttpUrl | str = Field(default="http://localhost:3000")
    cookie_secure: bool = Field(default=False)
    cookie_samesite: str = Field(default="lax")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")


@lru_cache
def get_settings() -> Settings:
    return Settings()
