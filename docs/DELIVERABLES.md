# Deliverables

## Links

- GitHub repository: https://github.com/sandip-pathe/task-mgmt-app
- Frontend: https://task-mgmt-app.vercel.app/
- Backend: https://task-mgmt-app-production.up.railway.app/
- Backend health: https://task-mgmt-app-production.up.railway.app/health

## Requirement Coverage

- Next.js frontend with responsive task dashboard
- FastAPI REST backend
- PostgreSQL persistence through SQLAlchemy and Alembic
- JWT auth stored in an HTTP-only cookie
- Password hashing before storage
- Protected task routes
- User-scoped task access
- Task create, list, read, update, and delete endpoints
- Write endpoint validation and consistent error responses
- Status filtering, title search, pagination, and sorting
- Loading, empty, and error states
- At least 3 meaningful tests across backend and frontend
- `.env.example` with required environment variables
- GitHub Actions CI pipeline

## Bonus Features Included

- Optimistic complete/delete UI with rollback
- Persisted dark mode
- Activity log per task
- CI pipeline

## Explicitly Skipped

- Dockerized setup
- Admin role
- Realtime WebSockets/SSE
- Task attachments

## Verification Commands

Backend:

```powershell
cd backend
python -m ruff check .
python -m pytest
```

Frontend:

```powershell
cd frontend
npm run lint
npm test
npm run build
```

## Deployment Notes

Railway service root should be `backend`. Vercel project root should be `frontend`.

Production variables:

```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=<long-random-secret>
JWT_EXPIRES_MINUTES=10080
FRONTEND_ORIGIN=https://task-mgmt-app.vercel.app
CORS_ORIGINS=https://task-mgmt-app.vercel.app
COOKIE_SECURE=true
COOKIE_SAMESITE=none
NEXT_PUBLIC_API_URL=/api
API_PROXY_URL=https://task-mgmt-app-production.up.railway.app
```
