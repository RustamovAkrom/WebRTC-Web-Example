"""
Alembic env.py — async migratsiyalar.

DATABASE_URL muhit o'zgaruvchisidan (yoki app.config) olinadi. Modellar
app.models'dan import qilinib, autogenerate uchun Base.metadata beriladi.

MUHIM: Bu fayl faqat `alembic upgrade head` komandasi bilan ishlatiladi.
Server ishga tushganda bu fayl import qilinmaydi.
"""

from __future__ import annotations

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from sqlalchemy import pool

from app.config import get_settings

# Barcha modellar Base.metadata'ga ro'yxatdan o'tishi uchun import shart.
from app.db import Base
import app.models  # noqa: F401  (yon ta'sir uchun import)

config = context.config

# Sozlamadagi URL o'rniga ENV'dan kelgan haqiqiy URL'ni ishlatamiz.
async_url = get_settings().async_database_url
if async_url:
    config.set_main_option("sqlalchemy.url", async_url)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        print("⚠️  DATABASE_URL topilmadi, migration o'tkazib yuboriladi")
        return
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
    )
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    url = config.get_main_option("sqlalchemy.url")
    if not url:
        print("⚠️  DATABASE_URL topilmadi, migration o'tkazib yuboriladi")
        return

    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    try:
        async with connectable.connect() as connection:
            await connection.run_sync(do_run_migrations)
        await connectable.dispose()
        print("✅ Database migrations completed successfully")
    except Exception as e:
        print(f"⚠️  Migration failed: {e}")
        raise


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
