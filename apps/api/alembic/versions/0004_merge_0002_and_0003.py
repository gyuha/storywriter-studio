"""merge_0002_and_0003

Revision ID: 22e20af02e5a
Revises: 0002_seed_admin_role_and_permission, 0003_novel_domain
Create Date: 2026-05-17 10:30:51.273292+00:00
"""

from __future__ import annotations

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '22e20af02e5a'
down_revision: Union[str, None] = ('0002_seed_admin_role_and_permission', '0003_novel_domain')
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
