"""World domain: characters, locations, world_settings, timelines, character_relationships.

Revision ID: 0005_world_domain
Revises: 22e20af02e5a
Create Date: auto-generated
"""

from __future__ import annotations

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision = "0005_world_domain"
down_revision = "22e20af02e5a"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute(
        "CREATE TYPE world_setting_type_enum AS ENUM "
        "('magic_system', 'nation_faction', 'history', 'rule')"
    )
    op.execute(
        "CREATE TYPE relationship_type_enum AS ENUM "
        "('lover', 'enemy', 'ally', 'family')"
    )

    op.create_table(
        "characters",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("appearance", sa.Text(), nullable=True),
        sa.Column("personality", sa.Text(), nullable=True),
        sa.Column("background", sa.Text(), nullable=True),
        sa.Column("role", sa.String(100), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
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
    op.create_index("ix_characters_novel_id", "characters", ["novel_id"])

    op.create_table(
        "locations",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("location_relation", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
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
    op.create_index("ix_locations_novel_id", "locations", ["novel_id"])

    op.create_table(
        "world_settings",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column(
            "type",
            postgresql.ENUM(
                "magic_system",
                "nation_faction",
                "history",
                "rule",
                name="world_setting_type_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column(
            "content",
            postgresql.JSONB(),
            nullable=False,
            server_default=sa.text("'{}'::jsonb"),
        ),
        sa.Column("summary", sa.Text(), nullable=True),
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
    op.create_index("ix_world_settings_novel_id", "world_settings", ["novel_id"])

    op.create_table(
        "timelines",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("event_name", sa.String(255), nullable=False),
        sa.Column("event_date", sa.String(100), nullable=True),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("chapter_id", sa.UUID(), nullable=True),
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
    op.create_index("ix_timelines_novel_id", "timelines", ["novel_id"])

    op.create_table(
        "character_relationships",
        sa.Column(
            "id",
            sa.UUID(),
            server_default=sa.text("gen_random_uuid()"),
            nullable=False,
        ),
        sa.Column("novel_id", sa.UUID(), nullable=False),
        sa.Column("character_id_a", sa.UUID(), nullable=False),
        sa.Column("character_id_b", sa.UUID(), nullable=False),
        sa.Column(
            "type",
            postgresql.ENUM(
                "lover",
                "enemy",
                "ally",
                "family",
                name="relationship_type_enum",
                create_type=False,
            ),
            nullable=False,
        ),
        sa.Column("description", sa.Text(), nullable=True),
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
        sa.ForeignKeyConstraint(["character_id_a"], ["characters.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["character_id_b"], ["characters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_character_relationships_novel_id", "character_relationships", ["novel_id"])


def downgrade() -> None:
    op.drop_index("ix_character_relationships_novel_id", table_name="character_relationships")
    op.drop_table("character_relationships")
    op.drop_index("ix_timelines_novel_id", table_name="timelines")
    op.drop_table("timelines")
    op.drop_index("ix_world_settings_novel_id", table_name="world_settings")
    op.drop_table("world_settings")
    op.drop_index("ix_locations_novel_id", table_name="locations")
    op.drop_table("locations")
    op.drop_index("ix_characters_novel_id", table_name="characters")
    op.drop_table("characters")
    op.execute("DROP TYPE relationship_type_enum")
    op.execute("DROP TYPE world_setting_type_enum")
