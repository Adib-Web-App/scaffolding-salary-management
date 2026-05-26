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
| `MONSTERASP_SERVER_COMPUTER_NAME` | `https://site71031.siteasp.net:8172` |
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

Database and default users are created automatically on first app start (`initDatabase` + seed users).

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
| WebDeploy auth failed | Re-check secrets; reset WebDeploy password in control panel |
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

## 7. PostgreSQL on MonsterASP (optional)

This workflow uses **SQLite** (`./data/production.db`) so no external database is required.

To use PostgreSQL instead, set `DATABASE_URL` in the generated `server/.env` during the workflow (extend the assemble step) and use a PostgreSQL instance your host provides or allows remotely.

---

## Related docs

- [DEPLOYMENT.md](./DEPLOYMENT.md) — Render + Vercel + PostgreSQL
- [MonsterASP GitHub Actions](https://help.monsterasp.net/books/github/page/how-to-deploy-website-via-github-actions)
