# Kamora Tech API

Async FastAPI + SQLAlchemy service backed by Neon PostgreSQL.

## Setup

```bash
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

- `DATABASE_URL`: rotated Neon async URL, e.g. `postgresql+asyncpg://USER:PASSWORD@HOST/DBNAME?sslmode=require` (never commit it).
- `JWT_SECRET_KEY`: a long random string (32+ chars).
- `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`: set only for initial admin creation, then clear them.

Run migrations and start the server:

```bash
alembic upgrade head
python -m app.core.seed
python -m app.core.bootstrap
uvicorn app.main:app --reload --port 8000
```

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Async Neon PostgreSQL URL used by SQLAlchemy and Alembic. |
| `JWT_SECRET_KEY` | Signs access tokens; must be 32+ chars and rotated if exposed. |
| `JWT_ALGORITHM` | JWT signing algorithm, default `HS256`. |
| `ACCESS_TOKEN_EXPIRE_MINUTES` / `REFRESH_TOKEN_EXPIRE_DAYS` | Token lifetimes. |
| `ENVIRONMENT` | `development` enables SQL echo; use `production` in deployed environments. |
| `BACKEND_CORS_ORIGINS` | Comma-separated origins allowed by CORS. |
| `FRONTEND_URL` | Public frontend origin used in generated links. |
| `VERIFICATION_TOKEN_EXPIRE_HOURS` / `PASSWORD_RESET_EXPIRE_MINUTES` | Link lifetimes. |
| `UPLOAD_DIR` / `MAX_UPLOAD_SIZE_MB` | Upload storage settings. |
| `SMTP_*`, `SMTP_FROM` | Outbound email configuration. |
| `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` | One-time initial admin credentials. |

## CORS and frontend

`BACKEND_CORS_ORIGINS` drives `settings.cors_origins` and defaults to `http://localhost:3002,http://127.0.0.1:3002`. Add your deployed frontend origin there; browsers will block requests from any other origin.

Set `NEXT_PUBLIC_API_URL=http://localhost:8000` in the frontend `.env.local` (and the deployed origin in production) so the Next.js app calls this backend. Keep this value free of secrets; it is public by design.

## Development token links

Open `http://localhost:8000/docs` to authorize with a bearer access token from the auth login endpoint. Email verification and password reset links point back to `FRONTEND_URL` and carry short-lived, single-use tokens (e.g. `/verify-email/?token=...`, `/reset-password/?token=...`)
. In development these links may appear in logs. Never log or share them in production, and rotate `JWT_SECRET_KEY` if a token is exposed.

## Tests

```bash
pytest
```

Security tests run without a database. Database-dependent tests skip unless `TEST_DATABASE_URL` is set to a disposable PostgreSQL URL; they create and drop all tables in that database and never use production data.

## Security notes

- Never commit `.env`, Neon URLs, JWT secrets, or admin passwords.
- Rotate the Neon connection string and JWT secret immediately if they may have leaked.
- Passwords are hashed with Argon2; refresh and reset tokens are stored as SHA-256 hashes.
- Bootstrap prints only the admin email, never the password. Clear the bootstrap variables after use.
- Use `sslmode=require` for Neon connections and restrict CORS to known origins.
