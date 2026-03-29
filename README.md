# Deploy-Ready App Infrastructure

A spec and boilerplate for building web apps that run identically on localhost and VPS. Designed for people building apps with AI coding assistants.

Point your AI agent at this repo and tell it: **"Follow SPEC.md to make my app deployment-ready."**

## Two Workflows

### Start from scratch

```bash
cp -r boilerplate/ my-new-app
cd my-new-app
cp .env.example .env
# edit .env with your keys
docker compose up
# open http://localhost:3000
```

### Convert an existing app

Have your AI agent read `SPEC.md` (specifically the "Conversion Checklist" section) and apply it to your existing codebase.

## What's In This Repo

| File | Purpose |
|------|---------|
| `SPEC.md` | The rules. Every deployment-ready app must follow this. |
| `boilerplate/` | A working Next.js starter that follows the spec. Copy it. |
| `CLAUDE.md` | Instructions for AI coding agents working with this repo. |

## Stack

- **Next.js 15** (App Router, standalone output)
- **Docker Compose** (the only way to run apps)
- **Node 20 Alpine** (multi-stage Dockerfile)
- **Coolify** (VPS deployment platform)

## Core Principles

- One command to run: `docker compose up`
- Same setup locally and on VPS — zero code changes to deploy
- All user-facing config through a GUI settings page, not file editing
- Multiple apps on one VPS don't conflict (automatic isolation via Docker Compose project scoping)
