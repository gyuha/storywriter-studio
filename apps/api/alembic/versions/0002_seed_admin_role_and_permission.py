"""Seed admin role and admin:users permission.

Revision ID: 0002_seed_admin_role_and_permission
Revises: 0001_initial_schema
"""

from __future__ import annotations

from alembic import op

revision: str = "0002_seed_admin_role_and_permission"
down_revision: str | None = "0001_initial_schema"
branch_labels: str | None = None
depends_on: str | None = None


def upgrade() -> None:
    op.execute(
        "INSERT INTO roles (id, name, description, created_at) "
        "VALUES (gen_random_uuid(), 'admin', '관리자', now()) "
        "ON CONFLICT (name) DO NOTHING"
    )
    op.execute(
        "INSERT INTO roles (id, name, description, created_at) "
        "VALUES (gen_random_uuid(), 'user', '일반 사용자', now()) "
        "ON CONFLICT (name) DO NOTHING"
    )
    op.execute(
        "INSERT INTO permissions (id, key, description, created_at) "
        "VALUES (gen_random_uuid(), 'admin:users', '사용자 관리', now()) "
        "ON CONFLICT (key) DO NOTHING"
    )
    op.execute(
        "INSERT INTO role_permissions (role_id, permission_id) "
        "SELECT r.id, p.id FROM roles r, permissions p "
        "WHERE r.name = 'admin' AND p.key = 'admin:users' "
        "ON CONFLICT DO NOTHING"
    )


def downgrade() -> None:
    op.execute(
        "DELETE FROM role_permissions WHERE role_id IN "
        "(SELECT id FROM roles WHERE name = 'admin') "
        "AND permission_id IN (SELECT id FROM permissions WHERE key = 'admin:users')"
    )
    op.execute("DELETE FROM permissions WHERE key = 'admin:users'")
    op.execute("DELETE FROM roles WHERE name IN ('admin', 'user')")
