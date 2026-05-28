"""Add tagline and tags columns to novels table.

Revision ID: 0007_novel_tagline_tags
Revises: 0006_story_beats
Create Date: 2026-05-28
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0007_novel_tagline_tags"
down_revision = "0006_story_beats"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("novels", sa.Column("tagline", sa.String(255), nullable=True))
    op.add_column(
        "novels",
        sa.Column(
            "tags",
            postgresql.JSONB(astext_type=sa.Text()),
            server_default=sa.text("'[]'::jsonb"),
            nullable=False,
        ),
    )


def downgrade() -> None:
    op.drop_column("novels", "tags")
    op.drop_column("novels", "tagline")
