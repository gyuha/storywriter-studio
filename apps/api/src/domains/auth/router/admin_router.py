from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_async_session
from core.exceptions import AppError, NotFoundError
from domains.auth.models import User
from domains.auth.schemas.admin_schemas import AdminUserResponse, PaginatedUsersResponse
from domains.auth.security import require_permission

router = APIRouter(prefix="/admin", tags=["admin"])


def _app_error_to_http(exc: AppError) -> HTTPException:
    headers = None
    if exc.status_code == status.HTTP_401_UNAUTHORIZED:
        headers = {"WWW-Authenticate": "Bearer"}
    return HTTPException(status_code=exc.status_code, detail=exc.message, headers=headers)


@router.get(
    "/users",
    response_model=PaginatedUsersResponse,
    dependencies=[Depends(require_permission("admin:users"))],
    summary="List all users (admin)",
)
async def list_users(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    session: AsyncSession = Depends(get_async_session),
) -> PaginatedUsersResponse:
    total_result = await session.execute(select(func.count()).select_from(User))
    total = total_result.scalar_one()

    users_result = await session.execute(
        select(User).offset((page - 1) * size).limit(size).order_by(User.created_at.desc())
    )
    users = list(users_result.scalars().all())

    return PaginatedUsersResponse(
        items=[AdminUserResponse.model_validate(u) for u in users],
        total=total,
        page=page,
        size=size,
    )


@router.post(
    "/users/{user_id}/activate",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("admin:users"))],
    summary="Activate a user account (admin)",
)
async def activate_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
) -> None:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise _app_error_to_http(NotFoundError("User"))
    await session.execute(update(User).where(User.id == user_id).values(is_active=True))
    await session.commit()


@router.post(
    "/users/{user_id}/deactivate",
    status_code=status.HTTP_204_NO_CONTENT,
    dependencies=[Depends(require_permission("admin:users"))],
    summary="Deactivate a user account (admin)",
)
async def deactivate_user(
    user_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
) -> None:
    result = await session.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise _app_error_to_http(NotFoundError("User"))
    await session.execute(update(User).where(User.id == user_id).values(is_active=False))
    await session.commit()
