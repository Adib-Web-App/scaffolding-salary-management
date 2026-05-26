# Scaffolding Salary Management System

Production-ready **web dashboard** for calculating daily scaffolding salary based on volume, with multi-worker job splitting, attendance, performance rankings, and PDF payslips.

## Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | React (Vite) + Tailwind CSS   |
| Backend  | Node.js + Express             |
| Database | PostgreSQL (production) / SQLite (local dev) |
| PDF      | PDFKit (pure JavaScript)      |

## Business Logic

### Work structure
- Each entry is **one shared job** with **multiple workers**
- **Volume** = Length × Width × Height (calculated once per job)
- **Total Salary** = Volume × Rate (Erection or Dismantle rate from project)
- **Individual Salary** = Total Salary ÷ Number of Workers
- **Volume Share** = Volume ÷ Number of Workers (per worker)

### Net salary
**Net Salary** = Total Earnings − Total Advance

### Currency
All financial values use **Malaysian Ringgit**: `RM 0.00`

## Features

1. **Project Management** — CRUD with erection/dismantle rates (RM)
2. **Daily Work Entry** — Shared jobs, multi-worker assignment, equal salary split
3. **Advance Payments** — Worker advances with remarks
4. **Summary Dashboard** — Erection/dismantle volumes, salary, advance, net; filters by date, worker, project
5. **Worker Performance** — Rankings by earnings, jobs, volume share
6. **Attendance** — Present/absent tracking, monthly summary, worker history
7. **Payroll & Payslip** — Monthly preview and PDF download

## Prerequisites

- Node.js 18+
- npm
- Windows-compatible (no native build tools)

## Quick Start (local — SQLite)

```bash
npm install
cp server/.env.example server/.env   # optional; defaults work for SQLite
npm run db:seed-users   # Default login users (admin, supervisor, viewer)
npm run seed            # Optional: demo projects & jobs
npm run dev
```

- **Web UI:** http://localhost:5173  
- **API:** http://localhost:3001  

## Online deployment

| Platform | Guide |
|----------|--------|
| **MonsterASP.NET** (WebDeploy + GitHub Actions) | [DEPLOYMENT-MONSTERASP.md](./DEPLOYMENT-MONSTERASP.md) |
| **Render + Vercel + PostgreSQL** | [DEPLOYMENT.md](./DEPLOYMENT.md) |

See **[DEPLOYMENT.md](./DEPLOYMENT.md)** for:

- Render (backend + PostgreSQL)
- Vercel (frontend)
- Environment variables (`DATABASE_URL`, `JWT_SECRET`, `CLIENT_URL`, `VITE_API_URL`)

### Local PostgreSQL (optional)

```bash
docker compose up -d
# In server/.env: DATABASE_URL=postgresql://corebuild:corebuild_dev@localhost:5432/corebuild_salary
npm run db:migrate
npm run db:seed-users
npm run dev
```

## Project Structure

```
server/src/
  controllers/     # Request handlers
  routes/          # API routes
  models/          # Database queries
  services/        # Salary calculations, PDF generation
  db/              # Schema, seed, migration

client/src/
  pages/           # Dashboard, Projects, Work, Advances, Performance, Attendance, Payroll
  components/      # Layout, Sidebar, DataTable, Modal
  services/        # API client, formatRM()
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| CRUD | `/api/projects` | Projects |
| CRUD | `/api/work-entries` | Work jobs (multi-worker) |
| POST | `/api/work-entries/preview` | Preview volume & salary split |
| CRUD | `/api/advances` | Advance payments |
| GET | `/api/summary` | Dashboard totals & breakdowns |
| GET | `/api/performance` | Worker rankings |
| CRUD | `/api/attendance` | Attendance records |
| GET | `/api/attendance/monthly-summary?month=YYYY-MM` | Monthly summary |
| GET | `/api/attendance/worker/:name` | Worker history |
| GET | `/api/payroll/preview?worker=&year=&month=` | Payroll preview |
| GET | `/api/payroll/payslip?worker=&year=&month=` | Download PDF |

## Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install all dependencies |
| `npm run dev` | Start API + web UI |
| `npm run seed` | Fresh DB with Jan–Mar 2026 sample data |
| `npm run seed:sample` | Add Jan–Mar 2026 jobs to existing DB |
| `npm run build` | Build frontend |

## Database

- Production: `server/data/production.db` (auto-created)
- Tests: `server/data/test.db` when `NODE_ENV=test` (isolated from production)
- Tables: `projects`, `work_jobs`, `work_job_workers`, `advances`, `attendance`
- Legacy `work_entries` data is migrated automatically on startup

## Sample Seed

```bash
npm run seed          # New database only
npm run seed:sample   # Existing database
```

Creates 3 projects, **19 work jobs** across January–March 2026 (erection & dismantle, multiple workers per job), advances, and attendance.

### Excel Export

**Daily Work Entry** — `daily-work-entry-YYYY-MM-DD.xlsx` (one row per worker; shared job fields vertically merged).

**Advance Payments** — `advance-payments-YYYY-MM-DD.xlsx` (one row per worker; Date and Project merged per group; RM formatting).

Both export **filtered** data only, with styled headers, borders, auto-sized columns, and auto-filter.

## License

Private / internal use.
