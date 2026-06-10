from typing import Any

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import TaskActivity


def record_activity(
    db: Session,
    *,
    task_id: str,
    user_id: str,
    action: str,
    summary: str,
    changes: dict[str, Any] | None = None,
) -> TaskActivity:
    event_index = (
        db.scalar(
            select(func.count())
            .select_from(TaskActivity)
            .where(TaskActivity.task_id == task_id, TaskActivity.user_id == user_id)
        )
        or 0
    ) + 1
    activity = TaskActivity(
        task_id=task_id,
        user_id=user_id,
        event_index=event_index,
        action=action,
        summary=summary,
        changes=changes,
    )
    db.add(activity)
    return activity
