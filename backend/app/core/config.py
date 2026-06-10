from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/rival_tasks"
    )
    jwt_secret: str = Field(default="dev-only-change-me-with-at-least-32-bytes")
    jwt_expires_minutes: int = Field(default=60 * 24 * 7)
    frontend_origin: str = Field(default="http://localhost:3000")
    cors_origins: str = Field(
        default="http://localhost:3000,https://task-mgmt-app.vercel.app"
    )
    cookie_secure: bool = Field(default=False)
    cookie_samesite: str = Field(default="lax")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def allowed_origins(self) -> list[str]:
        origins = [self.frontend_origin]
        origins.extend(origin.strip() for origin in self.cors_origins.split(",") if origin.strip())
        return list(dict.fromkeys(origins))


@lru_cache
def get_settings() -> Settings:
    return Settings()


def normalize_database_url(database_url: str) -> str:
    if database_url.startswith("postgresql://"):
        return database_url.replace("postgresql://", "postgresql+psycopg://", 1)
    if database_url.startswith("postgres://"):
        return database_url.replace("postgres://", "postgresql+psycopg://", 1)
    return database_url
