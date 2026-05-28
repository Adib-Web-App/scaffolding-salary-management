# Deploy to MonsterASP.NET (GitHub Actions)

Deploy **COREBUILD Salary Management** to [MonsterASP.NET](https://www.monsterasp.net/) using [WebDeploy](https://help.monsterasp.net/books/github/page/how-to-deploy-website-via-github-actions) and the workflow in `.github/workflows/deploy-monsterasp.yml`.

**Live URL:** http://scaffolding-salary-management.runasp.net/

---

## Security — read this first

1. **Never commit** WebDeploy passwords or `JWT_SECRET` to GitHub.
2. If your WebDeploy password was shared in chat or email, **change it** in the MonsterASP control panel immediately.
3. Store all credentials only in **GitHub → Settings → Secrets and variables → Actions**.

---

## 1. MonsterASP control panel setup

1. Log in to [MonsterASP control panel](https://admin.monsterasp.net/).
2. Open your website **site71031**.
3. **Enable WebDeploy** for the site (required for GitHub Actions deploy).
4. Confirm the site supports **Node.js** (Hosting Manager → Node.js if available).
5. Note your WebDeploy details (same as the publish profile):
   - **Website name:** `site71031`
   - **Server URL:** `https://site71031.siteasp.net:8172`
   - **Username:** `site71031`
   - **Password:** (from control panel — not from old publish files in git)

---

## 2. GitHub repository secrets

In **GitHub → your repo → Settings → Secrets and variables → Actions → New repository secret**, add:

| Secret name | Example / value |
|-------------|-----------------|
| `MONSTERASP_WEBSITE_NAME` | `site71031` |
| `MONSTERASP_SERVER_COMPUTER_NAME` | *(optional)* `https://site71031.siteasp.net:8172` only — **not** the full `/msdeploy.axd?site=...` URL (auto-built if omitted) |
| `MONSTERASP_SERVER_USERNAME` | `site71031` |
| `MONSTERASP_SERVER_PASSWORD` | Your WebDeploy password |
| `JWT_SECRET` | Long random string (e.g. 32+ chars) |
| `CLIENT_URL` | `http://scaffolding-salary-management.runasp.net` |

---

## 3. How deployment works

On every push to `main` (or manual **Run workflow**):

1. Builds the React client (`client/dist`)
2. Installs server production `node_modules` on **Windows** (correct `sqlite3` binaries)
3. Assembles a `publish/` folder with:
   - `server.js` + `web.config` (MonsterASP Node.js requirements)
   - Express API + SQLite database path `./data/production.db`
   - Static frontend files
4. Uploads via **WebDeploy** to your site `wwwroot`

On first start the app creates an **empty** SQLite file at `wwwroot/data/production.db` and seeds **default users only** (no projects, work entries, or advances).

**Your local data is not deployed.** Files under `server/data/*.db` are in `.gitignore` and are never sent to GitHub or MonsterASP. The live site starts fresh unless you upload your database (see section 8).

**Default logins** (change after first deploy):

| Role | Username | Password |
|------|----------|----------|
| ADMIN | admin | admin123 |
| SUPERVISOR | supervisor | supervisor123 |
| VIEWER | viewer | viewer123 |

---

## 4. Trigger a deploy

```bash
git push origin main
```

Or: **Actions → Deploy to MonsterASP.NET → Run workflow**

---

## 5. Verify

1. Open http://scaffolding-salary-management.runasp.net/
2. API health: http://scaffolding-salary-management.runasp.net/api/health  
   Should return `"database": "sqlite"`.
3. Log in with `admin` / `admin123` and change passwords via **Users**.

---

## 6. Troubleshooting

| Issue | What to do |
|-------|------------|
| **401 Unauthorized** (ERROR_USER_UNAUTHORIZED) | Use **WebDeploy password** from control panel (not FTP). Enable WebDeploy for the site. Reset password in panel, update `MONSTERASP_SERVER_PASSWORD` secret (no spaces). Username must be `site71031` exactly. |
| WebDeploy auth failed | Same as 401 — see [MonsterASP WebDeploy CLI docs](https://help.monsterasp.net/books/deploy/page/how-to-deploy-website-content-from-command-line) |
| 500 / blank page | Enable stdout logs in `web.config`; check `logs/` on server via FTP |
| `git` / workflow not running | Ensure workflow file is on `main` branch |
| SQLite errors | Ensure `data/` folder is writable under `wwwroot` |
| CORS errors | Set `CLIENT_URL` secret to exact site URL (no trailing slash) |

### Node.js on MonsterASP

- Entry file must be `wwwroot/server.js`
- `web.config` is required ([MonsterASP Node.js docs](https://help.monsterasp.net/books/nodejs/page/how-to-run-nodejs-application))
- App must listen on `process.env.PORT` (already configured)
- `node_modules` must be deployed with the app (workflow does this)

---

## 8. Restore your local database on production

If you had data on your PC at `server/data/production.db`, copy it to the server once.

### Option A — PowerShell script (Web Deploy)

On your Windows machine (with [Web Deploy 3](https://www.iis.net/downloads/microsoft/web-deploy) installed):

```powershell
cd C:\Users\User\scaffolding-salary-management-v2
$env:MONSTERASP_WEBSITE_NAME = "site71031"
$env:MONSTERASP_SERVER_USERNAME = "site71031"
$env:MONSTERASP_SERVER_PASSWORD = "YOUR_WEBDEPLOY_PASSWORD"
.\scripts\deploy-database-monsterasp.ps1
```

This uploads `server/data/production.db` to `wwwroot/data/production.db` on MonsterASP.

### Option B — FTP / File Manager

1. Open MonsterASP control panel → **File Manager** or **FTP**.
2. Go to `wwwroot/data/` (create `data` if missing).
3. Upload your local file:
   `C:\Users\User\scaffolding-salary-management-v2\server\data\production.db`
4. Overwrite the existing `production.db` on the server.
5. Recycle the site / restart Node.js in the panel.

### After upload

1. Open http://scaffolding-salary-management.runasp.net/
2. Log in with your **existing** usernames/passwords from the uploaded DB (not only the default seed users).
3. Future code deploys **skip** the `data/` folder so your production database is not overwritten by CI.

### Legacy file `salary.db`

Older local installs used `server/data/salary.db`. Production expects `production.db`. If you only have `salary.db`, copy/rename it locally to `production.db` before upload, or upload as `production.db` on the server.

---

## 7. PostgreSQL on MonsterASP (optional)

This workflow uses **SQLite** (`./data/production.db`) so no external database is required.

To use PostgreSQL instead, set `DATABASE_URL` in the generated `server/.env` during the workflow (extend the assemble step) and use a PostgreSQL instance your host provides or allows remotely.

---

## 9. Production data safety (LIVE site)

**Read first:** [PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md)

### What normal deploys do (safe)

- Update application code and `client/dist` only
- **Do not** upload or replace `wwwroot/data/production.db` (WebDeploy skips `data/`)
- On restart, run **additive** migrations only (`CREATE IF NOT EXISTS`, `ALTER ADD COLUMN`)
- Keep existing users, work entries, attendance, advances, payroll history

### What to do before each production update

1. Download / backup `wwwroot/data/production.db` (FTP or `scripts/backup-sqlite.ps1` on a local copy)
2. Push to `main` or run GitHub Actions deploy
3. Verify login and sample records after deploy

### Never run on production server

| Command | Why |
|---------|-----|
| `npm run seed` | Demo data |
| `npm run seed:sample` | Sample Jan–Mar 2026 jobs |
| `npm run db:seed-users` | Blocked; startup handles empty users table only |

`scripts/deploy-database-monsterasp.ps1` **replaces** the entire live database — use only to restore from backup.

---

## Related docs

- [PRODUCTION-DEPLOYMENT.md](./PRODUCTION-DEPLOYMENT.md) — Safe vs dangerous commands, migrations, backups
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Render + Vercel + PostgreSQL
- [MonsterASP GitHub Actions](https://help.monsterasp.net/books/github/page/how-to-deploy-website-via-github-actions)
