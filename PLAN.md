# Rival Task Manager Assessment Plan

## Goal

Build a production-minded full-stack task management app for the Rival.io assessment using:

- Frontend: Next.js, React, TypeScript, Tailwind, shadcn/ui
- Backend: Python REST API
- Database: PostgreSQL
- Auth: JWT with hashed passwords
- Tests: at least 3 meaningful tests
- Delivery: clear README, `.env.example`, deploy links, clean commit history

The focus is a polished frontend-heavy product with a reliable backend, a credible bonus set, and a clean milestone-based commit history.

## Confirmed Build Decisions

These choices are locked for implementation.

- Backend framework: FastAPI
- ORM and migrations: SQLAlchemy 2.x plus Alembic
- Auth persistence: JWT access token in an HTTP-only cookie
- Frontend deploy: Vercel
- Backend deploy: Railway
- Managed Postgres: Railway Postgres
- Bonus scope: include CI, optimistic UI, dark mode, and activity log; skip admin, realtime, attachments, and Docker

### Auth Implementation Choice

Use an HTTP-only JWT cookie instead of localStorage. This is a better production signal and still satisfies refresh persistence cleanly.

- Login/signup set the auth cookie
- `GET /auth/me` restores the logged-in user after refresh
- Logout clears the cookie
- Frontend API calls use `credentials: "include"`
- Backend CORS allows only the configured frontend origin
- Local development uses a non-secure cookie
- Production uses `Secure` plus `SameSite=None` for the Vercel-to-Railway cross-site setup

## Scope Decisions

### Required Features

- Signup and login
- Persisted frontend auth state
- Protected task routes
- User-scoped tasks
- Task CRUD
- Status filter
- Search by title
- Pagination
- Sort by due date, priority, and created date
- Client-side and server-side validation
- Responsive desktop and mobile layout
- Loading, empty, and error states
- README setup instructions
- `.env.example`
- Minimum 3 meaningful tests

### Bonus Features To Include

- GitHub Actions CI for tests
- Optimistic UI for complete/delete task actions
- Dark mode with persisted preference
- Activity log that tracks and displays task changes

### Bonus Features To Skip

- Admin role that can view all users' tasks
- Real-time updates with WebSockets or SSE
- Task attachments
- Dockerized setup

These skipped features are useful, but admin, attachments, and realtime add extra authorization, storage, and infrastructure complexity. Docker is skipped because it is not installed in this environment. The replacement bonus is activity log, which adds visible product value without external infrastructure.

## Proposed Architecture

### Repository Layout

```text
rival-task-manager/
  backend/
    app/
      api/
      activity/
      auth/
      core/
      db/
      models/
      schemas/
      tasks/
      tests/
    alembic/
    alembic.ini
    pyproject.toml
    tests/
  frontend/
    app/
    components/
    components/ui/
    lib/
    hooks/
    types/
  .env.example
  README.md
  PLAN.md
```

### Backend Libraries

- FastAPI for the REST API
- Uvicorn for local development
- SQLAlchemy 2.x for database access
- Alembic for migrations
- Pydantic for request and response validation
- Passlib with bcrypt for password hashing
- PyJWT or `python-jose` for JWTs
- pytest and httpx for API tests
- ruff for linting and formatting

### Frontend Libraries

- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui for core UI components
- React Hook Form for forms
- Zod for client validation
- TanStack Query for API state, caching, pagination, and optimistic updates
- date-fns for date formatting
- lucide-react for icons
- sonner for toast feedback

## Milestone 1 - Foundation, Auth, And Local Setup

### Deliverables

- Initialize repo structure
- Scaffold Next.js frontend
- Scaffold Python FastAPI backend
- Configure PostgreSQL through `DATABASE_URL`
- Support Railway Postgres for deployed and local development
- Add shared `.env.example`
- Create initial database migrations:
  - `users`
  - `tasks`
  - `task_activity`
- Implement backend config loading
- Implement signup and login
- Store passwords with bcrypt
- Set JWT cookie on login/signup
- Add `GET /auth/me`
- Add logout cookie clearing
- Add auth middleware
- Add basic health endpoint

### Validation

- Can connect to PostgreSQL through `DATABASE_URL`
- Can start backend locally
- Can signup, login, logout, and restore the session through API client
- JWT is required for protected routes

### Time Box

- 60-90 minutes

### Commits

1. `chore: scaffold frontend and backend workspaces`
2. `chore: add postgres configuration and environment examples`
3. `feat(api): add user auth with jwt sessions`

## Milestone 2 - Task API, Filters, Search, Sort, And Backend Tests

### Deliverables

- Implement task routes:
  - `POST /tasks`
  - `GET /tasks`
  - `GET /tasks/:id`
  - `PATCH /tasks/:id`
  - `DELETE /tasks/:id`
- Ensure all task routes are protected
- Ensure users can only access their own tasks
- Validate write requests:
  - title required
  - status enum
  - priority enum
  - due date format
- Add consistent error response shape
- Add filtering by status
- Add pagination with `page` and `limit`
- Add search by title
- Add sorting by due date, priority, and created date
- Record task activity for create, update, complete, and delete actions
- Add task activity endpoint:
  - `GET /tasks/:id/activity`
- Add backend tests for:
  - auth flow
  - protected task creation/listing
  - user isolation
  - validation error response
  - activity log creation

### API Notes

Task fields:

- `id`
- `user_id`
- `title`
- `description`
- `status`: `todo`, `in_progress`, `completed`
- `priority`: `low`, `medium`, `high`
- `due_date`
- `created_at`
- `updated_at`

List query example:

```text
GET /tasks?status=todo&search=design&page=1&limit=10&sort=due_date&order=asc
```

Consistent error shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {}
  }
}
```

### Validation

- API test suite passes
- Manual API checks work for CRUD, filtering, search, sort, and pagination
- A user cannot read, update, or delete another user's tasks

### Time Box

- 90-120 minutes

### Commits

4. `feat(api): add user-scoped task crud`
5. `feat(api): add task filtering search sorting and pagination`
6. `feat(api): add task activity log`
7. `test(api): cover auth task access validation and activity`

## Milestone 3 - Frontend Product Experience

### Deliverables

- Build authenticated app shell
- Add signup page
- Add login page
- Persist auth token across refresh
- Redirect logged-out users away from task pages
- Add task list page
- Add status filter
- Add search input
- Add sort controls
- Add pagination controls
- Add create task form
- Add edit task form
- Add mark-complete action
- Add delete action
- Add optimistic UI for complete/delete with rollback on failure
- Display per-task activity history in the edit/detail view
- Add loading, empty, and error states
- Add responsive mobile and desktop layout
- Add dark mode toggle with persisted preference

### UI Approach

Use shadcn/ui for:

- buttons
- inputs
- selects
- dialogs or sheets
- cards only for repeated task items
- badges
- pagination
- dropdown menus
- toast notifications

Keep the first screen as the actual task app after login, not a marketing page.

### Validation

- Client form validation catches obvious issues before submit
- Server validation still protects API
- Refresh keeps the user logged in
- Mobile layout remains usable
- Filters, search, sort, and pagination work together

### Time Box

- 2-3 hours

### Commits

8. `feat(web): add authenticated app shell and auth screens`
9. `feat(web): add task list filters search sort and pagination`
10. `feat(web): add task forms optimistic actions activity and dark mode`

## Milestone 4 - Polish, Docs, CI, Deployment Prep

### Deliverables

- Add frontend tests for key UI behavior or form validation
- Add GitHub Actions workflow:
  - backend tests
  - frontend lint/test/build
- Write clear README:
  - project overview
  - tech stack
  - local setup
  - environment variables
  - database migration commands
  - test commands
  - deployment notes
  - assumptions and trade-offs
- Verify `.env.example`
- Verify local setup with an existing PostgreSQL database or Railway Postgres connection string
- Prepare deployment:
  - frontend deploy target: Vercel
  - backend deploy target: Railway
  - managed Postgres: Railway Postgres
- Final pass on accessibility, responsive layout, and empty/error states

### Minimum Tests

Aim for more than the required 3, but these are the must-haves:

- Backend auth test: signup/login returns a usable JWT
- Backend authorization test: one user cannot access another user's task
- Backend task list test: search, status filter, sort, and pagination compose correctly
- Backend activity test: task changes create user-scoped activity events
- Frontend form test: create/edit form validates required title and invalid dates

### Commits

11. `test: add frontend validation coverage`
12. `ci: run backend and frontend checks on push`
13. `docs: add setup deployment notes and tradeoffs`

## Final Submission Checklist

- GitHub repo is public or access is granted
- README includes setup and trade-offs
- `.env.example` is complete
- App runs locally with a PostgreSQL `DATABASE_URL`
- Backend and frontend tests pass
- Frontend live link works
- Backend live link works
- Demo user flow works:
  - signup
  - login
  - create task
  - filter/search/sort
  - edit task
  - mark complete
  - delete task
  - view task activity history
  - refresh and stay logged in
- Commit history is clean and milestone-based

## Suggested Work Order By Hours

This can be built in hours with Codex doing the mechanical work, while still keeping the deliverable credible.

### Hour 0-2

- Milestone 1
- Start task schema and migrations

### Hour 2-4

- Finish Milestone 2
- Backend tests passing

### Hour 4-7

- Milestone 3 frontend core flow
- Auth persistence and task UI working
- Responsive and dark mode pass

### Hour 7-9

- Milestone 4 polish
- CI, README, deployment, final bug fixes

## Key Trade-Offs To Document In README

- JWT is stored in an HTTP-only cookie for better production posture; this requires credentialed frontend requests and explicit CORS configuration.
- No admin, realtime, attachments, or Docker setup to keep scope focused and compatible with the current environment.
- Optimistic UI is limited to low-risk task actions like complete/delete.
- Activity log tracks task lifecycle events and field changes, but does not attempt realtime delivery.
- FastAPI keeps the Python backend small and explicit while still giving strong validation and OpenAPI docs.
- shadcn/ui is used for speed and consistency while keeping custom product logic simple.
