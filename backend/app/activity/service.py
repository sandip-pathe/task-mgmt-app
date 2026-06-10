from typing import Any

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
    activity = TaskActivity(
        task_id=task_id,
        user_id=user_id,
        action=action,
        summary=summary,
        changes=changes,
    )
    db.add(activity)
    return activity
