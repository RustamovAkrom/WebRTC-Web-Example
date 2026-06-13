"""
config.py — muhit o'zgaruvchilaridan sozlamalarni o'qiydi (pydantic-settings).

Barcha sirlar (JWT_SECRET, DB parol) faqat ENV orqali keladi — kodda hardcode YO'Q.
Production'da JWT_SECRET o'rnatilmagan bo'lsa, ilova ataylab ishga tushmaydi.
"""

from __future__ import annotations

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )

    # Muhit: "dev" yoki "prod". prod'da xavfsizlik qattiqroq.
    environment: str = "dev"

    # PostgreSQL ulanish manzili (async driver).
    # Masalan: postgresql+asyncpg://app:app@db:5432/app
    database_url: str = "postgresql+asyncpg://app:app@localhost:5432/app"

    # JWT imzo kaliti. PROD'da albatta o'rnatilishi shart (pastdagi tekshiruv).
    jwt_secret: str = "dev-insecure-secret-change-me"
    jwt_alg: str = "HS256"
    access_token_ttl_min: int = 60 * 24  # 1 kun

    # Cookie sozlamalari (httpOnly sessiya cookie'si uchun).
    cookie_name: str = "session"
    cookie_secure: bool = False  # prod (HTTPS) da true
    cookie_samesite: str = "lax"
    cookie_domain: str | None = None

    # CORS: vergul bilan ajratilgan originlar ro'yxati (ENV: CORS_ORIGINS).
    # Bo'sh bo'lsa — dev defaultlari ishlatiladi.
    cors_origins: str = ""

    # Chat xabarlarini DB'ga saqlash (maxfiylik/hajm uchun default OFF).
    persist_chat: bool = False

    @property
    def is_prod(self) -> bool:
        return self.environment.lower() in {"prod", "production"}

    @property
    def cors_origins_list(self) -> list[str]:
        if self.cors_origins.strip():
            return [o.strip() for o in self.cors_origins.split(",") if o.strip()]
        # Dev defaultlari: Vite (5173) va nginx (8080).
        return [
            "http://localhost:5173",
            "http://localhost:8080",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:8080",
        ]

    def validate_for_prod(self) -> None:
        """Prod'da xavfsiz bo'lmagan defaultlar bilan ishga tushmaslik."""
        if self.is_prod and self.jwt_secret == "dev-insecure-secret-change-me":
            raise RuntimeError(
                "ENVIRONMENT=prod, lekin JWT_SECRET o'rnatilmagan. "
                "Xavfsiz tasodifiy kalitni JWT_SECRET ENV orqali bering."
            )


@lru_cache
def get_settings() -> Settings:
    return Settings()
