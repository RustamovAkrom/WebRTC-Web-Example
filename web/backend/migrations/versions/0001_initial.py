"""initial schema: users, rooms, room_sessions, chat_messages

Revision ID: 0001_initial
Revises:
Create Date: 2026-06-13
"""
from __future__ import annotations

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("username", sa.String(32), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("display_name", sa.String(64), nullable=False),
        sa.Column("avatar_url", sa.Text(), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.UniqueConstraint("email", name="uq_users_email"),
    )
    op.create_index(
        "ix_users_username_lower",
        "users",
        [sa.text("lower(username)")],
        unique=True,
    )

    op.create_table(
        "rooms",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("slug", sa.String(64), nullable=False),
        sa.Column("title", sa.String(120), nullable=True),
        sa.Column(
            "owner_user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column(
            "is_locked", sa.Boolean(), server_default=sa.false(), nullable=False
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.UniqueConstraint("slug", name="uq_rooms_slug"),
    )
    op.create_index("ix_rooms_slug", "rooms", ["slug"])
    op.create_index("ix_rooms_owner_user_id", "rooms", ["owner_user_id"])

    op.create_table(
        "room_sessions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("room_slug", sa.String(64), nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("display_name", sa.String(64), nullable=False),
        sa.Column(
            "joined_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column("left_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.create_index("ix_room_sessions_room_slug", "room_sessions", ["room_slug"])
    op.create_index("ix_room_sessions_user_id", "room_sessions", ["user_id"])

    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("room_slug", sa.String(64), nullable=False),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("display_name", sa.String(64), nullable=False),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index(
        "ix_chat_room_created", "chat_messages", ["room_slug", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_chat_room_created", table_name="chat_messages")
    op.drop_table("chat_messages")
    op.drop_index("ix_room_sessions_user_id", table_name="room_sessions")
    op.drop_index("ix_room_sessions_room_slug", table_name="room_sessions")
    op.drop_table("room_sessions")
    op.drop_index("ix_rooms_owner_user_id", table_name="rooms")
    op.drop_index("ix_rooms_slug", table_name="rooms")
    op.drop_table("rooms")
    op.drop_index("ix_users_username_lower", table_name="users")
    op.drop_table("users")
