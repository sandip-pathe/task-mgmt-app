from fastapi import APIRouter

from app.auth.router import router as auth_router
from app.tasks.router import router as tasks_router

api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(tasks_router)


@api_router.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}
