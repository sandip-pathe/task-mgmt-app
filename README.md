# Rival Task Manager

Full-stack task management app built for the Rival.io full-stack assessment.

## Live Links

- Frontend: https://task-mgmt-app.vercel.app/
- Backend: https://task-mgmt-app-production.up.railway.app/
- Health check: https://task-mgmt-app-production.up.railway.app/health

## Screenshot

![Rival Task Manager dashboard](docs/product-screenshot.png)

## Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn-style components
- Backend: FastAPI, SQLAlchemy, Alembic
- Database: PostgreSQL
- Auth: HTTP-only JWT cookie
- Tests: pytest, Vitest
- Deployment: Vercel frontend, Railway backend and Postgres

## Features

- Signup, login, logout, and refresh-persistent sessions
- User-scoped task CRUD with protected routes
- Status filter, title search, pagination, and sorting
- Create/edit form with client and server validation
- Mark complete and delete with optimistic UI rollback
- Loading, empty, and error states
- Responsive desktop/mobile layout
- Dark mode with persisted preference
- Task activity history
- GitHub Actions CI

## Local Setup

Docker is intentionally not required. Use local PostgreSQL or a Railway Postgres connection string.

1. Copy `.env.example` to `backend/.env` and update backend values.
2. Copy `.env.example` to `frontend/.env.local` and set `NEXT_PUBLIC_API_URL=http://localhost:8000`.
3. Start the backend:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
alembic upgrade head
uvicorn app.main:app --reload
```

4. Start the frontend:

```powershell
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`; API runs on `http://localhost:8000`.

## Environment

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/rival_tasks
JWT_SECRET=replace-me-with-a-long-random-secret
JWT_EXPIRES_MINUTES=10080
FRONTEND_ORIGIN=http://localhost:3000
CORS_ORIGINS=http://localhost:3000,https://task-mgmt-app.vercel.app
COOKIE_SECURE=false
COOKIE_SAMESITE=lax
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Production notes:

- Railway backend needs `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_ORIGIN`, `CORS_ORIGINS`, `COOKIE_SECURE=true`, and `COOKIE_SAMESITE=none`.
- Vercel frontend should use `NEXT_PUBLIC_API_URL=/api` and `API_PROXY_URL=https://task-mgmt-app-production.up.railway.app` so auth cookies stay same-origin.
- Railway may provide `postgresql://` or `postgres://`; the backend normalizes both for `psycopg`.

## API Summary

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `POST /tasks`
- `GET /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `GET /tasks/:id/activity`

Task listing supports `status`, `search`, `page`, `limit`, `sort`, and `order` together.

## Tests

```powershell
cd backend
python -m ruff check .
python -m pytest
```

```powershell
cd frontend
npm run lint
npm test
npm run build
```

CI runs backend lint, PostgreSQL migrations, backend tests, frontend lint, frontend tests, and frontend build on push and pull request.

## Deployment

Railway backend:

1. Set service root directory to `backend`.
2. Use `backend/railway.toml`.
3. Add a Railway Postgres database and set `DATABASE_URL`.
4. Generate a public backend domain.

Vercel frontend:

1. Set project root to `frontend`.
2. Set `NEXT_PUBLIC_API_URL=/api`.
3. Set `API_PROXY_URL` to the Railway backend URL.
4. Redeploy after backend URL changes.

## Assumptions And Trade-Offs

- FastAPI was chosen over Go because the implementer is stronger in Python and TypeScript.
- JWT is stored in an HTTP-only cookie instead of localStorage.
- Docker was skipped because it is not installed in this environment.
- Admin role, realtime updates, and attachments were skipped.
- Bonus features included: optimistic UI, activity history, dark mode, and CI.
