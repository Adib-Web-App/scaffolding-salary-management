# Production deployment & database safety

**COREBUILD CONSTRUCTION — Salary Management System**

This guide applies to the **live** site (e.g. http://scaffolding-salary-management.runasp.net/) and any environment with real data.

---

## Executive summary

| Area | Status |
|------|--------|
| GitHub Actions deploy (MonsterASP) | **Safe** — deploys code only; skips `wwwroot/data/` |
| App startup (`npm start`) | **Safe** — additive migrations; no table drops |
| `npm run db:migrate` | **Safe** — same as startup migrations |
| `npm run seed` / `seed:sample` | **Blocked** when `NODE_ENV=production` or `DATABASE_PATH=.../production.db` |
| `npm run db:seed-users` | **Blocked** in production (startup already seeds users if table is empty) |
| Uploading `production.db` via WebDeploy | **Dangerous** — overwrites entire database |

**Verdict:** Normal code deploys via GitHub Actions are **production-safe** for existing SQLite data, as long as you do **not** run demo seed commands against production and do **not** overwrite `production.db` unless intentional.

---

## 1. What runs on deploy (MonsterASP)

On push to `main`, `.github/workflows/deploy-monsterasp.yml`:

1. Builds client (`npm run build`)
2. Installs server dependencies (`npm ci --omit=dev`)
3. Publishes app code to `wwwroot` via WebDeploy
4. **Skips** syncing `data/` (`-skip:objectName=dirPath,absolutePath=.*[\\/]data$`)

**Not run in CI:** `npm run seed`, `npm run seed:sample`, `npm run db:migrate` as separate steps.

Your live `wwwroot/data/production.db` stays on the server.

---

## 2. What runs on app startup

Every time the Node app starts (`server/src/index.js` → `initDatabase()`):

### Safe (additive only)

- `CREATE TABLE IF NOT EXISTS` — never drops existing tables
- `ALTER TABLE ... ADD COLUMN` — only if column missing (SQLite `PRAGMA`; PostgreSQL `IF NOT EXISTS`)
- `CREATE INDEX IF NOT EXISTS`
- `INSERT INTO work_job_dimensions ... WHERE NOT EXISTS` — backfills dimension lines once per job
- Legacy `work_entries` → `work_jobs` migration — **only if `work_jobs` is empty**

### User seeding (idempotent)

- `seedDefaultUsers()` — runs only when **`users` table is empty**
- Does **not** reset passwords or delete existing users

### Not used in production paths

- No `DROP TABLE`
- No `TRUNCATE`
- No full database file replacement on startup

### Application DELETE statements

`DELETE FROM ...` in models is **per-record** (edit/delete one job, user, advance, etc.) via the API — not deployment logic.

---

## 3. Safe vs dangerous commands

### Safe for production (code deploy)

| Command | Where | Notes |
|---------|--------|------|
| `git push origin main` | CI | Triggers safe WebDeploy |
| `npm ci` / `npm install` | Build | Dependencies only |
| `npm run build` (client) | Build | Frontend assets |
| App pool restart / site recycle | Host | Runs safe `initDatabase()` once |

### Safe on production server (maintenance)

| Command | Notes |
|---------|--------|
| App restart | Runs additive migrations only |
| `npm run db:migrate` | Same as startup; **only if** `DATABASE_PATH` points at production DB intentionally |

### Never run on production (unless you know exactly why)

| Command | Risk |
|---------|------|
| `npm run seed` | Inserts demo projects, jobs, advances, attendance if `work_jobs` is empty |
| `npm run seed:sample` | Adds Jan–Mar 2026 sample data when that date range is empty |
| `npm run db:seed-users` | Blocked in prod; redundant with startup |
| `scripts/deploy-database-monsterasp.ps1` | **Overwrites** entire `production.db` |
| Deleting `wwwroot/data/production.db` | Loses all data |
| Removing WebDeploy `-skip ... data` | Could sync empty `data/` folder |
| `ALLOW_DANGEROUS_PRODUCTION_SEED=1` + seed scripts | Bypasses production guard |

---

## 4. Environment separation

### MonsterASP (SQLite)

```env
NODE_ENV=production
DATABASE_PATH=./data/production.db
JWT_SECRET=...
CLIENT_URL=http://scaffolding-salary-management.runasp.net
```

- Database file: `wwwroot/data/production.db` (not in git)
- Local dev: `server/data/production.db` or `salary.db` (gitignored)

### PostgreSQL (Render / optional)

```env
DATABASE_URL=postgresql://...
NODE_ENV=production
```

- Do not point local `.env` at production `DATABASE_URL`.
- Use a separate database for development.

### Production detection (seed scripts)

Scripts treat as **production** when:

- `NODE_ENV=production`, or
- `PRODUCTION=true`, or
- `DATABASE_PATH` ends with `production.db`

---

## 5. Backup before deploy or migration

### Local

```powershell
cd C:\Users\User\scaffolding-salary-management-v2
.\scripts\backup-sqlite.ps1
```

Creates `server/data/production.db.backup-YYYYMMDD-HHMMSS`.

### MonsterASP (recommended before major updates)

1. MonsterASP panel → **File Manager** or **FTP**
2. Download `wwwroot/data/production.db`
3. Store with date in filename, e.g. `production.db.backup-2026-05-28`
4. Deploy code (GitHub Actions)
5. Verify site; keep backup until confirmed

---

## 6. Safe deployment checklist

- [ ] Backup `production.db` (download from host)
- [ ] Confirm GitHub workflow still skips `data/` (see `deploy-monsterasp.yml`)
- [ ] Push to `main` or run workflow manually
- [ ] After deploy: open site, log in, spot-check work entries / payroll / users
- [ ] Do **not** run `npm run seed` on server
- [ ] Do **not** upload a local `.db` unless restoring from backup

---

## 7. Schema updates (new columns / tables)

New releases may add:

- Tables: `work_job_dimensions`, etc.
- Columns: `location`, `remarks` on `work_jobs`

These run automatically on **next app start** after deploy. No manual SQL required for normal updates.

To run migrations without starting the web server (optional):

```bash
cd server
# Ensure .env points at the DB you intend
npm run db:migrate
```

On production SQLite, `DATABASE_PATH` must be set to the real file path.

---

## 8. First-time vs existing production

| Scenario | Behavior |
|----------|----------|
| Brand-new server, no `production.db` | App creates DB + default users only if `users` empty |
| Existing `production.db` with data | Migrations add schema; **data kept** |
| Restoring from backup | Upload backup as `production.db` via FTP (replaces file) |

---

## 9. Related docs

- [DEPLOYMENT-MONSTERASP.md](./DEPLOYMENT-MONSTERASP.md) — GitHub Actions + WebDeploy
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Render / Vercel / PostgreSQL
- [scripts/deploy-database-monsterasp.ps1](./scripts/deploy-database-monsterasp.ps1) — **overwrite** DB (use with caution)
- [scripts/backup-sqlite.ps1](./scripts/backup-sqlite.ps1) — local backup helper

---

## 10. Audit log (code review)

Reviewed paths:

- `server/src/db/sqlite.js` — `initDatabase`, migrations
- `server/src/db/postgres.js` — `initDatabase`, migrations
- `server/src/db/schema.postgres.sql` — `CREATE IF NOT EXISTS` only
- `server/src/db/seed*.js` — production guards added
- `server/src/db/migrate.js` — calls `initDatabase` only
- `server/src/index.js` — startup
- `.github/workflows/deploy-monsterasp.yml` — skips `data/`
- Model `DELETE` — API-only, single-row deletes

**No `DROP TABLE` or `TRUNCATE` in migration/seed/deploy code.**
