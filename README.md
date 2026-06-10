# Rival Task Manager

Full-stack task management app for the Rival.io assessment.

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components
- Backend: FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL
- Auth: HTTP-only JWT cookie
- Tests: pytest, Vitest
- Deploy targets: Vercel frontend, Railway backend and Postgres

## Features

- Signup, login, logout, and refresh-persistent sessions
- User-scoped task CRUD
- Status filter, title search, pagination, and sorting
- Client and server validation
- Loading, empty, and error states
- Responsive desktop/mobile UI
- Optimistic complete/delete actions with rollback
- Dark mode with persisted preference
- Task activity history for create, update, complete, and delete events
- GitHub Actions CI

## Local Setup

Docker is intentionally not required. Use any local PostgreSQL database or a Railway Postgres connection string.

1. Create a PostgreSQL database.
2. Copy `.env.example` to `backend/.env` and update `DATABASE_URL` and `JWT_SECRET`.
3. Copy `.env.example` to `frontend/.env.local` and keep `NEXT_PUBLIC_API_URL=http://localhost:8000`.
4. Install and start the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
alembic upgrade head
uvicorn app.main:app --reload
```

5. Install and start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:3000`; the API runs at `http://localhost:8000`.

## Environment Variables

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/rival_tasks
JWT_SECRET=replace-me-with-a-long-random-secret
JWT_EXPIRES_MINUTES=10080
FRONTEND_ORIGIN=http://localhost:3000
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
NEXT_PUBLIC_API_URL=http://localhost:8000
```

For production across Vercel and Railway, set:

- `COOKIE_SECURE=true`
- `COOKIE_SAMESITE=none`
- `FRONTEND_ORIGIN=https://your-vercel-domain.vercel.app`
- `NEXT_PUBLIC_API_URL=https://your-railway-api-domain.up.railway.app`

Railway may provide `DATABASE_URL` as `postgresql://...` or `postgres://...`; the backend normalizes both to the installed `psycopg` driver.

## Commands

Backend:

```powershell
cd backend
python -m ruff check .
python -m pytest
alembic upgrade head
uvicorn app.main:app --reload
```

Frontend:

```powershell
cd frontend
npm run lint
npm test
npm run build
npm run dev
```

## API Summary

Auth:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`

Tasks:

- `POST /tasks`
- `GET /tasks?status=todo&search=design&page=1&limit=8&sort=due_date&order=asc`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `GET /tasks/:id/activity`

Errors use a consistent shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request",
    "details": {}
  }
}
```

## Deployment

### Railway Backend

1. Create a Railway project with a PostgreSQL database.
2. Add the backend service from this repository.
3. In the service settings, set the root directory to `backend`.
4. Set the environment variables from `.env.example`.
5. Keep `backend/railway.toml`; it runs migrations and starts Uvicorn.

If deploying from the repository root instead, Railway may not auto-detect Python because the Python `pyproject.toml` lives in `backend/`. The repo-root `requirements.txt` and `runtime.txt` make the root deployment detectable as Python, and the repo-root `railway.toml` also forces the Python provider for Nixpacks. The recommended Railway setup is still root directory `backend` with config path `/backend/railway.toml`.

### Vercel Frontend

1. Create a Vercel project from this repository.
2. Set the project root to `frontend`.
3. Set `NEXT_PUBLIC_API_URL` to the Railway API URL.
4. Add the Vercel domain to Railway as `FRONTEND_ORIGIN`.

## Tests

The backend has API coverage for:

- Signup/login/session restoration
- Protected task routes and user isolation
- Filtering/search/sort/pagination composition
- Consistent validation errors
- Activity log creation

The frontend has validation coverage for:

- Auth form email/password rules
- Task title validation
- Due date validation

## CI Pipeline

GitHub Actions is configured in `.github/workflows/ci.yml` and runs on every push and pull request.

Backend job:

- Starts a PostgreSQL 16 service
- Installs the FastAPI backend
- Runs `ruff`
- Runs Alembic migrations against PostgreSQL
- Runs `pytest`

Frontend job:

- Installs dependencies with `npm ci`
- Runs ESLint
- Runs Vitest
- Builds the Next.js app

## Assumptions And Trade-Offs

- FastAPI was chosen over Go because the implementer is stronger in Python and TypeScript.
- JWT is stored in an HTTP-only cookie for better production posture than localStorage.
- Backend tests use an isolated SQLite database for speed, while CI verifies Alembic migrations against PostgreSQL and production/local persistence uses PostgreSQL.
- Docker is skipped because it is not installed in this environment.
- Admin role, realtime updates, and attachments are skipped to keep the assessment focused.
- Activity history is persisted and displayed, but it is not delivered live over WebSockets or SSE.
