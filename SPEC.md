# Deployment-Ready App Spec

Every app runs with `docker compose up`. Same command on your Mac, same command on the VPS. If it works locally, it deploys without code changes.

This spec is the single source of truth. Follow every rule and the app will be production-ready from day one.

---

## 1. Containerization

Every app MUST have a `docker-compose.yml` at root. This is the only way the app is started — both locally and on VPS.

```bash
# How to run (same command everywhere)
docker compose up
```

If the app needs a database, cache, browser, or any service — it goes in `docker-compose.yml` as a service. Never install dependencies on the host machine.

```yaml
services:
  app:
    build: .
    ports:
      - "${PORT:-3000}:3000"
    env_file: .env
    volumes:
      - ./data:/app/data
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      - db  # only if needed

  db:  # only if the app needs a database
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-app}
      POSTGRES_USER: ${DB_USER:-app}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-localdev}
    volumes:
      - db-data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  db-data:
```

## 2. Multi-App Isolation

Multiple apps on the same VPS must not conflict. Docker Compose handles this automatically when you follow these rules:

**How it works:** Docker Compose uses the directory name as the project prefix. An app in `invoice-tool/` gets containers named `invoice-tool-app-1`, `invoice-tool-db-1`, a network called `invoice-tool_default`, and volumes named `invoice-tool_db-data`. A different app in `crm-app/` gets its own isolated set. No conflicts.

**Rules:**

- **Never use `container_name:`** in docker-compose.yml. It bypasses project-scoped naming and causes collisions.
- **Parameterize the external port:** `"${PORT:-3000}:3000"`. Locally it defaults to 3000. On VPS, Coolify assigns a unique port per app.
- **Parameterize database credentials:** Use `${DB_NAME:-app}`, `${DB_USER:-app}`, `${DB_PASSWORD:-localdev}`. Each app on VPS gets unique values set in the deployment platform's UI.
- **Named volumes are project-scoped.** `db-data` in `invoice-tool/` becomes `invoice-tool_db-data`. No extra config needed.
- **Networks are project-scoped.** Services from different apps cannot talk to each other by default. This is correct behavior.

**Summary:** Each app = its own directory = its own project name = isolated containers, volumes, networks, and ports. No manual configuration needed beyond setting `PORT` and `DB_NAME` in the deployment platform.

## 3. Configuration

### Environment Variables (.env)

Every configurable value goes in `.env`. The app reads from environment variables, never hardcoded values.

Required files:
- `.env.example` — committed to git, has every variable with placeholder values
- `.env` — actual values, NEVER committed (add to `.gitignore`)

```bash
# .env.example
PORT=3000
DATA_DIR=/app/data

# Database (only if app uses one)
DATABASE_URL=postgres://app:localdev@db:5432/app
DB_NAME=app
DB_USER=app
DB_PASSWORD=localdev

# API keys (add what your app needs, fill in .env)
# MY_API_KEY=
```

Rules:
- NEVER hardcode API keys, tokens, passwords, or URLs in source code
- NEVER hardcode file paths — use `DATA_DIR` env var
- NEVER reference `localhost` or `127.0.0.1` for service connections — use Docker service names (`db`, `redis`, `chrome`, etc.)
- Database connection strings use the Docker service name as host: `postgres://user:pass@db:5432/mydb`

### Two Tiers of Credentials

**Tier 1: Infrastructure credentials** — API keys, database passwords, service tokens that the app needs to function. These go in `.env` and are set once per environment (locally in `.env` file, on VPS in Coolify's env var UI). The app reads them from environment variables (`os.environ` in Python) and never asks the user for them.

**Tier 2: User-provided credentials** — Things the user enters at runtime because they're personal, per-session, or change often. Examples: a store URL, a spreadsheet ID, a login for an external service.

### GUI-First Settings (Tier 2)

Every user-facing configuration MUST be changeable from a GUI. Never ask users to edit files or restart the app.

Every app MUST have a `/settings` page that:
1. Asks the user for any runtime credentials on first use
2. Saves them to a JSON config file inside the `data/` volume
3. Loads them automatically on subsequent launches
4. Allows the user to update them anytime

The implementation pattern:

```python
# src/config.py
import json, os

DATA_DIR = os.environ.get("DATA_DIR", "./data")
CONFIG_PATH = os.path.join(DATA_DIR, "config.json")

# Define what your app needs from the user.
# Edit this list for each app.
REQUIRED_SETTINGS = [
    {"key": "store_url", "label": "Store URL", "type": "text", "placeholder": "https://your-store.example.com"},
    {"key": "api_key", "label": "API Key", "type": "password", "placeholder": "sk-..."},
]

def load_config():
    try:
        with open(CONFIG_PATH) as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return {}

def save_config(config):
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    with open(CONFIG_PATH, "w") as f:
        json.dump(config, f, indent=2)

def is_configured():
    if not REQUIRED_SETTINGS:
        return True
    config = load_config()
    return all(config.get(s["key"], "").strip() for s in REQUIRED_SETTINGS)
```

To add a new user-configurable setting: add an entry to `REQUIRED_SETTINGS`. The settings page and persistence are pre-built in the boilerplate.

Rules:
- NEVER ask the user to edit `.env` or restart the app to change runtime credentials
- NEVER store Tier 2 credentials in a database — a simple JSON file in `data/` is enough
- The `/settings` page should show which credentials are configured (masked) and which are missing
- If a required credential is missing, redirect to `/settings` with a clear message, don't crash

## 4. File Storage

All persistent files (uploads, generated outputs, downloads) go to `${DATA_DIR}` which maps to `./data/` via the docker-compose volume mount.

```python
# CORRECT
output_path = os.path.join(os.environ.get("DATA_DIR", "./data"), "output.pdf")

# WRONG
output_path = "/Users/someone/Documents/output.pdf"
output_path = "./output.pdf"  # disappears on container restart
```

The `./data/` directory is gitignored but persists across container restarts via the volume mount.

## 5. Health Check

Every app MUST expose:

```
GET /health → 200 OK
```

Used by Docker, the deployment platform, and monitoring. Add it to docker-compose:

```yaml
services:
  app:
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:3000/health')"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## 6. Browser Automation

If the app uses Playwright or any headless browser:

```yaml
# docker-compose.yml
services:
  app:
    environment:
      - BROWSER_WS_ENDPOINT=ws://chrome:3000
    depends_on:
      - chrome

  chrome:
    image: browserless/chrome
    restart: unless-stopped
```

In code, always connect via the env var:

```python
# CORRECT
from playwright.sync_api import sync_playwright
pw = sync_playwright().start()
browser = pw.chromium.connect_over_cdp(os.environ["BROWSER_WS_ENDPOINT"])

# WRONG — won't work in container
browser = pw.chromium.launch()
```

## 7. Dockerfile

Every app MUST have a `Dockerfile`:

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY src/ ./src/
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["gunicorn", "--bind", "0.0.0.0:3000", "--chdir", "src", "app:app"]
```

Gunicorn is the production server. Flask's built-in server is for development only.

## 8. Project Structure

```
my-app/
├── docker-compose.yml    # THE way to run the app
├── Dockerfile            # how to build the app container
├── requirements.txt      # Python dependencies
├── .env.example          # all env vars with placeholders
├── .env                  # actual values (gitignored)
├── .gitignore
├── README.md             # what it does, how to use it
├── data/                 # persistent files (gitignored, volume-mounted)
│   └── .gitkeep
└── src/
    ├── app.py            # Flask app + routes (health, settings, your pages)
    ├── config.py         # REQUIRED_SETTINGS + load/save helpers
    └── templates/
        ├── layout.html   # base template
        ├── index.html    # your app's main page
        └── settings.html # settings UI
```

## 9. .gitignore

Every app MUST have:

```
.env
data/*
!data/.gitkeep
__pycache__/
*.pyc
.DS_Store
```

## 10. README.md

Every app MUST have a README:

```markdown
# App Name

One sentence: what it does.

## Run

cp .env.example .env
# edit .env with your API keys
docker compose up

## Use

Open http://localhost:3000

## What it needs

- List required API keys and what they're for
- Note which ones are optional
```

## 11. Source Control

Every app lives in a private GitHub repository. The AI assistant handles all git operations — the user never needs to run git commands directly.

**First-time setup (AI does this):**
1. Initialize a git repo in the app directory
2. Create a private repo on GitHub (via `gh repo create --private`)
3. Push the initial code
4. Tell the user the repo URL so they can share it with colleagues or the VPS admin

**Pushing updates (AI does this):**
1. Stage and commit changes with a descriptive message
2. Push to GitHub
3. If Coolify auto-deploy is configured, the update goes live automatically

**Adding collaborators:**
1. Run `gh repo invite <collaborator-email>` — the collaborator receives an email invite
2. Once accepted, they can clone and work on the app

**Rules:**
- Repos MUST be private
- Never commit `.env`, `data/`, or `__pycache__/` (the `.gitignore` handles this)
- The AI should remember the repo URL across sessions so the user doesn't re-enter it

## 12. Deployment (Coolify)

The VPS runs Coolify, which deploys apps directly from GitHub repos. The same `docker-compose.yml` that runs locally runs on VPS. Zero code changes.

**One-time VPS setup:**
1. Coolify must be connected to GitHub as a source (GitHub App integration — configured once in Coolify settings)

**Deploying an app:**
1. In Coolify: New Resource → Docker Compose → select the GitHub repo
2. Set env vars in Coolify UI (copy from `.env.example`, use strong passwords for production)
3. Assign a domain (Coolify provisions HTTPS automatically)
4. Deploy

**Auto-deploy:** Enable in Coolify so that every push to the GitHub repo triggers a rebuild and redeploy automatically.

**Multi-app VPS:** Each app gets its own resource in Coolify with its own env vars. Set unique `PORT`, `DB_NAME`, and `DB_PASSWORD` per app. Apps are fully isolated (see Section 2).

## 13. HTTPS

Never expose an app over plain HTTP. All production traffic MUST go through HTTPS.

Coolify handles TLS termination automatically — when you assign a domain to an app in Coolify, it provisions an SSL certificate via Let's Encrypt and routes HTTPS traffic to your container's internal port. No code changes or extra config needed.

Rules:
- The app itself always listens on HTTP internally (port 3000). HTTPS termination happens at the reverse proxy layer.
- Never hardcode `http://` URLs for production. Use relative URLs or respect the `X-Forwarded-Proto` header.
- When testing locally, HTTP on `localhost` is fine. HTTPS only matters on the VPS.

## 14. Security Baseline

Vibe-coded apps are frequently deployed with security holes. Follow these rules to avoid the most common ones.

**Database services must NOT expose ports to the host.** The `db` service in docker-compose.yml should have NO `ports:` mapping. The app connects to it via the Docker network using the service name (`db`). There is no reason for the database to be reachable from outside.

```yaml
# CORRECT — no ports, only reachable from within Docker network
db:
  image: postgres:16-alpine
  environment:
    POSTGRES_DB: ${DB_NAME:-app}
    POSTGRES_USER: ${DB_USER:-app}
    POSTGRES_PASSWORD: ${DB_PASSWORD:-localdev}
  volumes:
    - db-data:/var/lib/postgresql/data

# WRONG — database is exposed to the internet
db:
  image: postgres:16-alpine
  ports:
    - "5432:5432"  # anyone can connect
```

**Change default passwords for production.** The `.env.example` uses `localdev` as the default database password. This is fine for local development. On VPS, set `DB_PASSWORD` to a strong random value in Coolify's env var UI.

**Never leak stack traces to users.** In production, error pages must show a user-friendly message, not internal details like file paths, database schemas, or stack traces. In Flask, disable debug mode (`app.run(debug=False)`) — gunicorn does this by default.

**Don't trust client-side checks.** Authentication, authorization, and input validation MUST happen on the server. Never check passwords or permissions in browser JavaScript.

## 15. Logging

When a deployed app breaks, logs are how you find out what happened.

**All logging goes to stdout/stderr.** Docker captures it automatically. To view logs:

```bash
# on VPS (or locally)
docker compose logs -f app        # follow app logs
docker compose logs -f             # follow all services
docker compose logs --tail 100 app # last 100 lines
```

Coolify also shows logs in its web UI for each resource.

**The `/health` endpoint should report dependency status.** Beyond returning 200, a richer health check helps diagnose issues:

```python
# In src/app.py
@app.route("/health")
def health():
    status = {"app": "ok"}

    # If using a database, check connectivity
    # try:
    #     db.session.execute(text("SELECT 1"))
    #     status["db"] = "ok"
    # except:
    #     status["db"] = "error"

    healthy = all(v == "ok" for v in status.values())
    return jsonify(status), (200 if healthy else 503)
```

**Never log secrets.** Don't log API keys, passwords, tokens, or full request bodies that might contain sensitive data.

## 16. Updates and Rollbacks

**Updating a deployed app:**

The vibe coder makes changes and tells their AI assistant to push. If Coolify auto-deploy is enabled, the update goes live within a minute. Otherwise, the VPS admin clicks "Deploy" in Coolify.

**Rolling back a bad deploy:**

In Coolify's deployment history for the app, select a previous successful build and redeploy it. No terminal access needed.

Alternatively, the vibe coder can tell their AI assistant to revert the last change and push again.

## 17. Database Migrations

Any app with a database will eventually need schema changes. Use a consistent pattern so migrations run automatically.

**Convention:**
- Migration files live in `./migrations/`
- Migrations run on container startup, before the app serves requests

**With Flask-Migrate (recommended):**

```python
# In requirements.txt, add:
# flask-migrate
# flask-sqlalchemy

# In app.py:
from flask_migrate import Migrate
migrate = Migrate(app, db)
```

```dockerfile
# Update the CMD to run migrations before starting
CMD ["sh", "-c", "cd src && flask db upgrade && gunicorn --bind 0.0.0.0:3000 app:app"]
```

**Without an ORM — raw SQL migrations:**

Create numbered SQL files in `./migrations/`:
```
migrations/
├── 001_create_users.sql
├── 002_add_email_column.sql
```

Add an entrypoint script that runs pending migrations before starting the app. The boilerplate does not include this by default — add it when your app first needs a database.

**Rules:**
- Migrations must be idempotent (safe to run twice)
- Never modify a migration that has already been deployed — create a new one
- Test migrations locally with `docker compose up` before pushing

## 18. Basic Auth for Internal Tools

Many vibe-coded apps are internal tools that should not be publicly accessible. For apps that don't need full user authentication, add a simple password gate.

**Option A: App-level password (recommended for most internal tools)**

Add a `BASIC_AUTH_PASSWORD` setting to the settings system:

```python
# In src/config.py, add to REQUIRED_SETTINGS:
{"key": "app_password", "label": "App Password", "type": "password", "placeholder": "Set a password to protect this app"}
```

Then add middleware that checks for a session cookie or prompts for the password. The boilerplate's settings page already handles storing and loading this value.

**Option B: Coolify-level auth**

Coolify supports adding HTTP Basic Auth at the reverse proxy level — no code changes needed. Configure it in the Coolify resource settings. This protects the entire app including the settings page.

**Rules:**
- If the app handles any non-public data, it MUST have some form of access control
- Never store passwords in plain text in the database — for simple apps, a hashed password in `data/config.json` is sufficient
- For apps that need real user accounts (multiple users, roles, permissions), use a proper auth library like Flask-Login

---

## Conversion Checklist

For converting an existing app to match this spec:

1. **Add `Dockerfile`** — use the template from Section 7
2. **Add `docker-compose.yml`** — use the template from Section 1; uncomment services as needed
3. **Add `requirements.txt`** — list all Python dependencies, include `flask` and `gunicorn`
4. **Create `.env.example`** — list every env var with placeholder values
5. **Move secrets to env vars** — search source code for hardcoded API keys, passwords, URLs; replace with `os.environ["X"]`
6. **Add `.env` to `.gitignore`**
7. **Replace hardcoded file paths** with `os.environ.get("DATA_DIR", "./data")`; add `./data:/app/data` volume mount to docker-compose.yml
8. **Replace `localhost` service references** with Docker service names (`db`, `redis`, `chrome`)
9. **Add `GET /health`** route returning 200
10. **Add the settings system** — copy `src/config.py` and `src/templates/settings.html` from the boilerplate; add the settings route to your app; edit `REQUIRED_SETTINGS` for your app
11. **Remove any `container_name:`** from docker-compose.yml
12. **Remove exposed database ports** — the `db` service should have no `ports:` mapping
13. **Add access control** — if the app handles non-public data, add basic auth (Section 18)
14. **Verify** — `docker compose up` works from a clean clone, no secrets in source code, `/health` returns 200

---

## Quick Reference

Before deploying any app, verify:

- [ ] `docker compose up` works from a clean clone
- [ ] No secrets in source code
- [ ] `.env.example` has all variables listed
- [ ] `/health` returns 200
- [ ] All file I/O uses `DATA_DIR`
- [ ] No `localhost` references for service connections
- [ ] No `container_name:` in docker-compose.yml
- [ ] `PORT`, `DB_NAME`, `DB_PASSWORD` are parameterized
- [ ] `/settings` page works for all user-configurable values
- [ ] README exists and is accurate
- [ ] Database services have no `ports:` mapping
- [ ] Default passwords changed for VPS deployment
- [ ] App has access control if it handles non-public data
- [ ] Error pages don't leak stack traces in production
