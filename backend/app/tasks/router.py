from datetime import UTC, datetime
from math import ceil
from typing import Annotated, Any

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy import Select, case, func, select
from sqlalchemy.orm import Session

from app.activity.service import record_activity
from app.api.errors import api_error
from app.auth.deps import get_current_user
from app.db.session import get_db
from app.models import Task, TaskActivity, User
from app.schemas.activity import ActivityResponse
from app.schemas.task import (
    SortOrder,
    TaskCreate,
    TaskListResponse,
    TaskResponse,
    TaskSort,
    TaskStatus,
    TaskUpdate,
)

router = APIRouter(prefix="/tasks", tags=["tasks"])


def owned_task_or_404(db: Session, task_id: str, user_id: str) -> Task:
    task = db.scalar(select(Task).where(Task.id == task_id, Task.user_id == user_id))
    if not task:
        raise api_error(404, "TASK_NOT_FOUND", "Task not found")
    return task


def apply_task_sort(
    query: Select[tuple[Task]], sort: TaskSort, order: SortOrder
) -> Select[tuple[Task]]:
    if sort == "priority":
        sort_expr = case(
            (Task.priority == "low", 1),
            (Task.priority == "medium", 2),
            (Task.priority == "high", 3),
            else_=0,
        )
    elif sort == "due_date":
        sort_expr = Task.due_date
    else:
        sort_expr = Task.created_at

    sort_expr = sort_expr.asc() if order == "asc" else sort_expr.desc()
    return query.order_by(sort_expr, Task.created_at.desc())


def task_changes(task: Task, payload: TaskUpdate) -> dict[str, dict[str, Any]]:
    changes: dict[str, dict[str, Any]] = {}
    update_data = payload.model_dump(exclude_unset=True)
    for field, new_value in update_data.items():
        old_value = getattr(task, field)
        comparable_old = old_value.isoformat() if isinstance(old_value, datetime) else old_value
        comparable_new = new_value.isoformat() if isinstance(new_value, datetime) else new_value
        if comparable_old != comparable_new:
            changes[field] = {"from": comparable_old, "to": comparable_new}
    return changes


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
def create_task(
    payload: TaskCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    task = Task(user_id=current_user.id, **payload.model_dump())
    db.add(task)
    db.flush()
    record_activity(
        db,
        task_id=task.id,
        user_id=current_user.id,
        action="created",
        summary="Task created",
        changes=payload.model_dump(mode="json"),
    )
    db.commit()
    db.refresh(task)
    return task


@router.get("", response_model=TaskListResponse)
def list_tasks(
    status_filter: Annotated[TaskStatus | None, Query(alias="status")] = None,
    search: Annotated[str | None, Query(min_length=1, max_length=120)] = None,
    page: Annotated[int, Query(ge=1)] = 1,
    limit: Annotated[int, Query(ge=1, le=100)] = 10,
    sort: TaskSort = "created_at",
    order: SortOrder = "desc",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TaskListResponse:
    conditions = [Task.user_id == current_user.id]
    if status_filter:
        conditions.append(Task.status == status_filter)
    if search:
        conditions.append(Task.title.ilike(f"%{search.strip()}%"))

    total = db.scalar(select(func.count()).select_from(Task).where(*conditions)) or 0
    query = select(Task).where(*conditions)
    query = apply_task_sort(query, sort, order).offset((page - 1) * limit).limit(limit)
    items = list(db.scalars(query).all())

    return TaskListResponse(
        items=items,
        page=page,
        limit=limit,
        total=total,
        pages=ceil(total / limit) if total else 0,
    )


@router.get("/{task_id}", response_model=TaskResponse)
def get_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    return owned_task_or_404(db, task_id, current_user.id)


@router.patch("/{task_id}", response_model=TaskResponse)
def update_task(
    task_id: str,
    payload: TaskUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Task:
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data:
        raise api_error(400, "EMPTY_UPDATE", "Provide at least one field to update")

    task = owned_task_or_404(db, task_id, current_user.id)
    changes = task_changes(task, payload)
    if not changes:
        return task

    old_status = task.status
    for field, value in update_data.items():
        setattr(task, field, value)
    task.updated_at = datetime.now(UTC)

    action = "completed" if old_status != "completed" and task.status == "completed" else "updated"
    summary = "Task marked complete" if action == "completed" else "Task updated"
    record_activity(
        db,
        task_id=task.id,
        user_id=current_user.id,
        action=action,
        summary=summary,
        changes=changes,
    )
    db.commit()
    db.refresh(task)
    return task


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_task(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    task = owned_task_or_404(db, task_id, current_user.id)
    record_activity(
        db,
        task_id=task.id,
        user_id=current_user.id,
        action="deleted",
        summary="Task deleted",
        changes={"title": task.title},
    )
    db.delete(task)
    db.commit()


@router.get("/{task_id}/activity", response_model=list[ActivityResponse])
def task_activity(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[TaskActivity]:
    owned_task_or_404(db, task_id, current_user.id)
    return list(
        db.scalars(
            select(TaskActivity)
            .where(TaskActivity.task_id == task_id, TaskActivity.user_id == current_user.id)
            .order_by(TaskActivity.created_at.desc())
        ).all()
    )
