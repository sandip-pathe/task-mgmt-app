from datetime import datetime

from pydantic import BaseModel


class ActivityResponse(BaseModel):
    id: str
    task_id: str
    action: str
    summary: str
    changes: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}
