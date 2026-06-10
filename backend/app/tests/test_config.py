from app.core.config import normalize_database_url


def test_normalize_database_url_accepts_railway_style_postgres_urls() -> None:
    assert normalize_database_url("postgresql://user:pass@host:5432/db") == (
        "postgresql+psycopg://user:pass@host:5432/db"
    )
    assert normalize_database_url("postgres://user:pass@host:5432/db") == (
        "postgresql+psycopg://user:pass@host:5432/db"
    )
    assert normalize_database_url("sqlite:///./local-dev.db") == "sqlite:///./local-dev.db"
