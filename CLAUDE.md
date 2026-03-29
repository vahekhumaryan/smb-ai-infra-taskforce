# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repo Is

A deployment spec and Next.js boilerplate for building VPS-ready containerized apps. The spec ensures every app runs identically on localhost and VPS via `docker compose up`.

**Key files:**
- `SPEC.md` — The universal deployment spec. Read this first. Every rule lives here.
- `boilerplate/` — A working Next.js 15 + React 19 + TypeScript reference implementation that follows the spec.

## Workflow A: New App from Boilerplate

```bash
cp -r boilerplate/ /path/to/my-new-app
cd /path/to/my-new-app
```

Then:
1. Update `package.json` name field to your app name
2. Edit `src/lib/config.ts` — update `REQUIRED_SETTINGS` array for your app's needs
3. Replace `src/app/page.tsx` with your app's UI
4. Edit `.env.example` — add any API keys your app needs
5. If your app needs a database: uncomment the `db` service in `docker-compose.yml` and `DATABASE_URL` in `.env.example`
6. `cp .env.example .env`, fill in values, `docker compose up`

## Workflow B: Convert an Existing App

Read `SPEC.md` section "Conversion Checklist" and apply each step. Copy files from `boilerplate/` as needed (Dockerfile, settings system, health check, docker-compose.yml).

## Non-Negotiable Rules

- `docker compose up` is the ONLY way to run the app
- Tier 1 creds (API keys) in `.env`, Tier 2 creds (user-provided) via `/settings` page saved to `data/config.json`
- All file I/O through `process.env.DATA_DIR` (maps to `./data/` volume)
- Service connections use Docker service names (`db`, `redis`, `chrome`), never `localhost`
- Never use `container_name:` in docker-compose.yml (breaks multi-app isolation on VPS)
- `GET /health` must return 200
- `next.config.js` must have `output: "standalone"`

## Boilerplate Key Files

- `boilerplate/src/lib/config.ts` — `REQUIRED_SETTINGS` array + `loadConfig()`/`saveConfig()`. Edit this per app.
- `boilerplate/src/lib/config-check.ts` — `checkConfig()` redirects to `/settings` if unconfigured. Call at top of server pages.
- `boilerplate/src/app/settings/page.tsx` — Pre-built settings UI (client component).
- `boilerplate/src/app/api/config/route.ts` — GET/POST API for `data/config.json`. Masks password fields.
- `boilerplate/src/app/health/route.ts` — Health endpoint.
- `boilerplate/docker-compose.yml` — Uncomment services (db, redis, chrome) as needed.
- `boilerplate/Dockerfile` — Multi-stage build for standalone Next.js.
