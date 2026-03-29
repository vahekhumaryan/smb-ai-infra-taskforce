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
- **Parameterize the external port:** `"${PORT:-3000}:3000"`. Locally it defaults to 3000. On VPS, the deployment platform (Coolify) assigns a unique port per app.
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
NODE_ENV=development
DATA_DIR=/app/data

# Database (only if app uses one)
DATABASE_URL=postgres://app:localdev@db:5432/app
DB_NAME=app
DB_USER=app
DB_PASSWORD=localdev

# API keys (leave empty, fill in .env)
ANTHROPIC_API_KEY=
OPENAI_API_KEY=
```

Rules:
- NEVER hardcode API keys, tokens, passwords, or URLs in source code
- NEVER hardcode file paths — use `DATA_DIR` env var
- NEVER reference `localhost` or `127.0.0.1` for service connections — use Docker service names (`db`, `redis`, `chrome`, etc.)
- Database connection strings use the Docker service name as host: `postgres://user:pass@db:5432/mydb`

### Two Tiers of Credentials

**Tier 1: Infrastructure credentials** — API keys, database passwords, service tokens that the app needs to function. These go in `.env` and are set once per environment (locally in `.env` file, on VPS in Coolify's env var UI). The app reads them from `process.env` and never asks the user for them.

**Tier 2: User-provided credentials** — Things the user enters at runtime because they're personal, per-session, or change often. Examples: "paste your Shopify store URL", "enter your Google Sheet ID", "provide your LinkedIn login."

### GUI-First Settings (Tier 2)

Every user-facing configuration MUST be changeable from a GUI. Never ask users to edit files or restart the app.

Every app MUST have a `/settings` page that:
1. Asks the user for any runtime credentials on first use
2. Saves them to a JSON config file inside the `data/` volume
3. Loads them automatically on subsequent launches
4. Allows the user to update them anytime

The implementation pattern:

```javascript
// src/lib/config.ts
const CONFIG_PATH = path.join(process.env.DATA_DIR || './data', 'config.json');

// Define what your app needs from the user.
// Edit this array for each app.
export const REQUIRED_SETTINGS = [
  { key: "shopify_store_url", label: "Shopify Store URL", type: "text", placeholder: "https://your-store.myshopify.com" },
  { key: "api_key", label: "API Key", type: "password", placeholder: "sk-..." },
];

function loadConfig() {
  try { return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8')); }
  catch { return {}; }
}

function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
}
```

To add a new user-configurable setting: add an entry to `REQUIRED_SETTINGS`. The settings page, API route, and persistence are pre-built in the boilerplate.

Rules:
- NEVER ask the user to edit `.env` or restart the app to change runtime credentials
- NEVER store Tier 2 credentials in a database — a simple JSON file in `data/` is enough
- The `/settings` page should show which credentials are configured (masked) and which are missing
- If a required credential is missing, redirect to `/settings` with a clear message, don't crash

## 4. File Storage

All persistent files (uploads, generated outputs, downloads) go to `${DATA_DIR}` which maps to `./data/` via the docker-compose volume mount.

```javascript
// CORRECT
const outputPath = path.join(process.env.DATA_DIR || './data', 'output.pdf');

// WRONG
const outputPath = '/Users/someone/Documents/output.pdf';
const outputPath = './output.pdf';  // disappears on container restart
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
      test: ["CMD", "wget", "-q", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
```

## 6. Browser Automation

If the app uses Playwright, Puppeteer, or any headless browser:

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

```javascript
// CORRECT
const browser = await puppeteer.connect({
  browserWSEndpoint: process.env.BROWSER_WS_ENDPOINT
});

// WRONG — won't work in container
const browser = await puppeteer.launch();
```

## 7. Dockerfile

Every app MUST have a `Dockerfile`. Use multi-stage builds:

```dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
RUN mkdir -p /app/data && chown -R nextjs:nodejs /app/data
USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
```

The `next.config.js` MUST have `output: "standalone"` for this Dockerfile to work.

## 8. Project Structure

```
my-app/
├── docker-compose.yml    # THE way to run the app
├── Dockerfile            # how to build the app container
├── .env.example          # all env vars with placeholders
├── .env                  # actual values (gitignored)
├── .gitignore
├── README.md             # what it does, how to use it
├── package.json
├── next.config.js        # must have output: "standalone"
├── data/                 # persistent files (gitignored, volume-mounted)
│   └── .gitkeep
└── src/
    ├── lib/
    │   ├── config.ts         # REQUIRED_SETTINGS + load/save helpers
    │   └── config-check.ts   # checkConfig() redirect helper
    └── app/
        ├── layout.tsx
        ├── page.tsx
        ├── health/
        │   └── route.ts      # GET /health → 200
        ├── settings/
        │   └── page.tsx      # settings UI
        └── api/
            └── config/
                └── route.ts  # GET/POST config.json API
```

## 9. .gitignore

Every app MUST have:

```
.env
data/
node_modules/
.next/
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

- Anthropic API key (for X feature)
- Shopify API key (optional, for Y feature)
```

## 11. Deployment

1. Push repo to a Git host (Gitea, GitHub, etc.)
2. In the deployment platform (Coolify): New Resource → Docker Compose → point to repo
3. Set env vars in the platform UI (copy from `.env.example`, use strong passwords)
4. Deploy

The same `docker-compose.yml` that runs locally runs on VPS. Zero code changes.

For multi-app VPS: each app gets its own resource in Coolify with its own env vars. Set unique `PORT`, `DB_NAME`, and `DB_PASSWORD` per app.

---

## Conversion Checklist

For converting an existing app to match this spec:

1. **Add `Dockerfile`** — use the multi-stage template from Section 7
2. **Add `docker-compose.yml`** — use the template from Section 1; uncomment services as needed
3. **Set `output: "standalone"`** in `next.config.js`
4. **Create `.env.example`** — list every env var with placeholder values
5. **Move secrets to env vars** — search source code for hardcoded API keys, passwords, URLs; replace with `process.env.X`
6. **Add `.env` to `.gitignore`**
7. **Replace hardcoded file paths** with `process.env.DATA_DIR`; add `./data:/app/data` volume mount to docker-compose.yml
8. **Replace `localhost` service references** with Docker service names (`db`, `redis`, `chrome`)
9. **Add `GET /health`** route returning 200
10. **Add the settings system** — copy `src/lib/config.ts`, `config-check.ts`, `src/app/settings/page.tsx`, `src/app/api/config/route.ts` from the boilerplate; edit `REQUIRED_SETTINGS` for your app
11. **Remove any `container_name:`** from docker-compose.yml
12. **Verify** — `docker compose up` works from a clean clone, no secrets in source code, `/health` returns 200

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
