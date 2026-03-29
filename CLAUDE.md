# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

SMB AI Infra Taskforce — a deployment spec and Python/Flask boilerplate for making vibe-coded apps production-ready. Three roles use this repo, each guided by an AI assistant.

**Key files:**
- `SPEC.md` — The universal deployment spec. Every technical rule lives here.
- `boilerplate/` — A working Python/Flask starter that follows the spec.

## Identify the Role

When someone asks for help using this repo, figure out which role they are:

### Role 1: Vibe Coder (building or converting an app)

**Starting from the boilerplate:**
1. Copy `boilerplate/` to a new directory, rename it to the app name
2. Edit `src/config.py` — update `REQUIRED_SETTINGS` for the app's needs
3. Replace `src/templates/index.html` with the app's UI
4. Add your routes to `src/app.py`
5. Edit `.env.example` — add any API keys the app needs
6. Add any new dependencies to `requirements.txt`
7. If the app needs a database: uncomment the `db` service in `docker-compose.yml` and `DATABASE_URL` in `.env.example`
8. `cp .env.example .env`, fill in values, `docker compose up` to test

**Converting an existing app:**
Read SPEC.md section "Conversion Checklist" and apply each step.

**When the app is ready to share:**
1. Initialize git, create a **private** GitHub repo (`gh repo create <name> --private`), push the code
2. Tell the user the repo URL — they share this with colleagues or the VPS admin
3. Remember the repo URL for future sessions so updates can be pushed without re-setup

**Adding collaborators:**
Run `gh repo invite <email>` — the person gets an email invite to accept.

**Pushing updates:**
Stage, commit with a descriptive message, push to GitHub. If Coolify auto-deploy is enabled, the update goes live automatically.

### Role 2: Colleague (running someone else's app locally)

Someone gave them a GitHub repo URL and they want to run the app on their machine.

1. Clone the repo
2. `cp .env.example .env`
3. Walk them through filling in `.env` — ask what API keys they have, explain what each one is for
4. `docker compose up`
5. Tell them to open the app in their browser; if there's a `/settings` page, guide them through it
6. If they need to be added as a collaborator first, tell them to ask the app owner to invite their email

### Role 3: VPS Admin (deploying to production via Coolify)

Someone gave them a GitHub repo URL to deploy on the VPS.

**Prerequisites (ask if not confirmed):**
- Coolify is running on the VPS
- Coolify is connected to GitHub as a source (GitHub App integration)
- They have access to Coolify's dashboard

**Deployment steps:**
1. In Coolify: New Resource → Docker Compose → select the GitHub repo
2. Set environment variables in Coolify UI:
   - Copy all variables from `.env.example`
   - Set `DB_PASSWORD` to a strong random value (not `localdev`)
   - Fill in any required API keys (ask the user if unsure)
3. Assign a domain — Coolify provisions HTTPS automatically
4. Enable auto-deploy (webhook) so future pushes redeploy automatically
5. Deploy and verify `/health` returns 200

**If credentials are missing**, ask the VPS admin to get them from the app owner. Don't guess or skip.

## Non-Negotiable Rules (from SPEC.md)

- `docker compose up` is the ONLY way to run the app
- Tier 1 creds (API keys) in `.env`, Tier 2 creds (user-provided) via `/settings` page saved to `data/config.json`
- All file I/O through `os.environ.get("DATA_DIR", "./data")` (maps to `./data/` volume)
- Service connections use Docker service names (`db`, `redis`, `chrome`), never `localhost`
- Never use `container_name:` in docker-compose.yml (breaks multi-app isolation)
- Database services must NOT expose ports to host
- `GET /health` must return 200
- Repos must be private on GitHub
- HTTPS is handled by Coolify — app listens on HTTP internally
- Apps with non-public data must have access control
- Error pages must not leak stack traces in production
- Use gunicorn in production, never Flask's built-in dev server

## Boilerplate Key Files

- `boilerplate/src/config.py` — `REQUIRED_SETTINGS` list + `load_config()`/`save_config()`. Edit per app.
- `boilerplate/src/app.py` — Flask app with health check, settings routes, and index page. Add your routes here.
- `boilerplate/src/templates/settings.html` — Pre-built settings UI.
- `boilerplate/src/templates/layout.html` — Base HTML template. Extend this for your pages.
- `boilerplate/src/templates/index.html` — Replace with your app's main page.
- `boilerplate/docker-compose.yml` — Uncomment services (db, redis, chrome) as needed.
- `boilerplate/Dockerfile` — Python 3.12 + gunicorn production server.
- `boilerplate/requirements.txt` — Add your Python dependencies here.
