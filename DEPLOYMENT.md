# Deployment Guide — COREBUILD Salary Management System

Deploy the **React (Vite)** frontend on **Vercel** and the **Node/Express** API on **Render**, with **PostgreSQL** for production data.

Local development continues to work **without PostgreSQL** (SQLite file in `server/data/`). Set `DATABASE_URL` when you want to test against Postgres locally.

---

## Architecture

| Component | Platform | Notes |
|-----------|----------|--------|
| Frontend | Vercel | Static build from `client/` |
| API | Render Web Service | `server/` — Node 18+ |
| Database | Render PostgreSQL (or Neon/Supabase) | `DATABASE_URL` |

---

## Environment variables

### Backend (`server` — Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes (production) | `postgresql://...` connection string |
| `JWT_SECRET` | Yes | Long random string for auth tokens |
| `CLIENT_URL` | Yes | Vercel app URL(s), comma-separated. Example: `https://your-app.vercel.app` |
| `PORT` | Auto on Render | Set by Render |
| `PG_SSL` | Render Postgres | Set to `true` (included in `render.yaml`) |
| `NODE_ENV` | Recommended | `production` |

### Frontend (`client` — Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes (production) | Full API base with `/api`. Example: `https://corebuild-salary-api.onrender.com/api` |

### Local development

**Server** — copy `server/.env.example` to `server/.env`:

```env
PORT=3001
JWT_SECRET=dev-secret-change-in-production
CLIENT_URL=http://localhost:5173
# Optional Postgres:
# DATABASE_URL=postgresql://corebuild:corebuild_dev@localhost:5432/corebuild_salary
```

**Client** — no `.env` needed locally; Vite proxies `/api` to port 3001.

---

## 1. PostgreSQL database

### Option A — Render (recommended with blueprint)

1. Push this repo to GitHub.
2. In Render Dashboard → **New** → **Blueprint** → connect repo (uses root `render.yaml`).
3. Render creates **PostgreSQL** + **Web Service**.
4. After deploy, open the API service **Shell** and run:

```bash
npm run db:migrate
npm run db:seed-users
```

Optional sample data:

```bash
npm run seed
```

### Option B — Local Docker Postgres

```bash
docker compose up -d
```

In `server/.env`:

```env
DATABASE_URL=postgresql://corebuild:corebuild_dev@localhost:5432/corebuild_salary
```

Then:

```bash
cd server
npm run db:migrate
npm run db:seed-users
```

---

## 2. Render backend

### Manual setup (without blueprint)

1. **New → Web Service** → connect repository.
2. **Root Directory:** `server`
3. **Build Command:** `npm install`
4. **Start Command:** `npm start`
5. **Environment:**
   - `DATABASE_URL` — from your Postgres instance (Internal URL on Render).
   - `JWT_SECRET` — generate a secure value.
   - `CLIENT_URL` — your Vercel URL (set after frontend deploy).
   - `PG_SSL` — `true` for Render Postgres.
   - `NODE_ENV` — `production`
6. Deploy, then run migrations in Shell (see above).

### Health check

`GET https://your-api.onrender.com/api/health`

Should return `{ "success": true, "database": "postgres" }`.

### CORS

`CLIENT_URL` must match the exact Vercel origin (no trailing slash). Multiple origins:

```env
CLIENT_URL=https://app.vercel.app,http://localhost:5173
```

---

## 3. Vercel frontend

1. **New Project** → import repo.
2. **Root Directory:** `client`
3. **Framework Preset:** Vite
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`
6. **Environment variable:**
   - `VITE_API_URL` = `https://YOUR-RENDER-SERVICE.onrender.com/api`
7. Deploy.

8. Update Render `CLIENT_URL` to your Vercel URL and redeploy the API if needed.

### `vercel.json`

SPA routing is configured so React Router paths work on refresh.

---

## 4. Default users (after `db:seed-users`)

| Role | Username | Password |
|------|----------|----------|
| ADMIN | `admin` | `admin123` |
| SUPERVISOR | `supervisor` | `supervisor123` |
| VIEWER | `viewer` | `viewer123` |

Change these passwords in production via the **Users** page (admin) or by updating the database.

---

## 5. NPM scripts reference

### Root

```bash
npm install
npm run dev          # SQLite local + Vite (default)
npm run build        # Build client
```

### Server (`cd server`)

| Script | Purpose |
|--------|---------|
| `npm run dev` | API with hot reload |
| `npm start` | Production API |
| `npm run db:migrate` | Create/update schema + seed users if empty |
| `npm run db:seed-users` | Insert default users only |
| `npm run seed` | Full demo data (projects, jobs, etc.) |
| `npm run seed:sample` | Jan–Mar 2026 sample jobs |

---

## 6. Local dev summary

| Mode | Setup |
|------|--------|
| **SQLite (default)** | No `DATABASE_URL` → `server/data/production.db` |
| **Local Postgres** | `docker compose up` + `DATABASE_URL` in `server/.env` |

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## 7. Troubleshooting

| Issue | Fix |
|-------|-----|
| CORS errors | Match `CLIENT_URL` to exact Vercel URL; redeploy API |
| 401 on all routes | Check `JWT_SECRET` is set on Render |
| API calls fail on Vercel | Set `VITE_API_URL` with `https://` and `/api` suffix |
| `relation does not exist` | Run `npm run db:migrate` on Render Shell |
| Render DB SSL | Set `PG_SSL=true` or use provided `render.yaml` |
| Cold start delay | Free Render tier spins down after inactivity |

---

## 8. Security checklist (production)

- [ ] Strong `JWT_SECRET`
- [ ] Change default user passwords
- [ ] `CLIENT_URL` only lists trusted origins
- [ ] Postgres not publicly exposed without credentials
- [ ] HTTPS only (Vercel + Render default)
