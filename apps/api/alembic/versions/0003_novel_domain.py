"""Novel domain: novels and chapters tables.

Revision ID: 0003_novel_domain
Revises: 0001_initial_schema
Create Date: auto-generated
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0003_novel_domain"
down_revision = "0001_initial_schema"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE TYPE chapter_status_enum AS ENUM ('draft', 'reviewing', 'done')")

    op.create_table(
        "novels",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("user_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("genre", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("cover_image_url", sa.String(500), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_novels_user_id", "novels", ["user_id"])

    op.create_table(
        "chapters",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", postgresql.JSONB, nullable=True),
        sa.Column("order_key", sa.Float(), nullable=False),
        sa.Column(
            "status",
            postgresql.ENUM("draft", "reviewing", "done", name="chapter_status_enum", create_type=False),
            nullable=False,
            server_default="draft",
        ),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["novel_id"], ["novels.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_chapters_novel_id", "chapters", ["novel_id"])
    op.create_index("ix_chapters_order_key", "chapters", ["order_key"])


def downgrade() -> None:
    op.drop_index("ix_chapters_order_key", table_name="chapters")
    op.drop_index("ix_chapters_novel_id", table_name="chapters")
    op.drop_table("chapters")
    op.drop_index("ix_novels_user_id", table_name="novels")
    op.drop_table("novels")
    op.execute("DROP TYPE chapter_status_enum")
