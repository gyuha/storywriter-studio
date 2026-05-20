"""Add story_beats table for ADV-02 plot structure management.

Revision ID: 0006_story_beats
Revises: 0005_world_domain
Create Date: 2026-05-20
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op

revision = "0006_story_beats"
down_revision = "0005_world_domain"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE TYPE story_beat_type_enum AS ENUM ('setup', 'rising', 'climax', 'falling', 'resolution', 'other')"
    )
    op.create_table(
        "story_beats",
        sa.Column("id", sa.UUID(), server_default=sa.text("gen_random_uuid()"), nullable=False),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("chapter_id", sa.UUID(), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text(), nullable=True),
        sa.Column(
            "beat_type",
            sa.Enum(
                "setup", "rising", "climax", "falling", "resolution", "other",
                name="story_beat_type_enum",
            ),
            nullable=False,
            server_default="other",
        ),
        sa.Column("order_key", sa.Float(), nullable=False, server_default="1.0"),
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
        sa.ForeignKeyConstraint(["chapter_id"], ["chapters.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_story_beats_novel_id", "story_beats", ["novel_id"])


def downgrade() -> None:
    op.drop_index("ix_story_beats_novel_id", table_name="story_beats")
    op.drop_table("story_beats")
    op.execute("DROP TYPE story_beat_type_enum")
