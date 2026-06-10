from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field, field_validator

TaskStatus = Literal["todo", "in_progress", "completed"]
TaskPriority = Literal["low", "medium", "high"]
TaskSort = Literal["created_at", "due_date", "priority"]
SortOrder = Literal["asc", "desc"]


class TaskCreate(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus = "todo"
    priority: TaskPriority = "medium"
    due_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def strip_title(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("Title is required")
        return value


class TaskUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus | None = None
    priority: TaskPriority | None = None
    due_date: datetime | None = None

    @field_validator("title")
    @classmethod
    def strip_optional_title(cls, value: str | None) -> str | None:
        if value is None:
            return value
        value = value.strip()
        if not value:
            raise ValueError("Title is required")
        return value


class TaskResponse(BaseModel):
    id: str
    title: str
    description: str | None
    status: TaskStatus
    priority: TaskPriority
    due_date: datetime | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class TaskListResponse(BaseModel):
    items: list[TaskResponse]
    page: int
    limit: int
    total: int
    pages: int
