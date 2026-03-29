# SMB AI Infra Taskforce 

**Make vibe-coded apps actually usable by other people.**

&nbsp;

## Why This Exists

AI coding assistants make it easy to build working apps fast. The harder part comes after — when someone else needs to run it, or when it's time to move off localhost and onto a server.

Most vibe-coded apps end up as zip files passed around on Slack. They work on the original machine but break everywhere else: wrong runtime version, missing dependencies, hardcoded paths, secrets in the source. Deploying them for the team to use becomes a separate project entirely.

&nbsp;

## The Fix

This repo is a spec, a starter template, and a set of AI-guided workflows for three roles. Follow the spec, and your app:

- Runs with one command: `docker compose up`
- Works the same on your Mac, your colleague's Windows PC, and a VPS
- Has a settings page so users configure it from a browser, not by editing files
- Doesn't conflict with other apps when you run ten of them on the same server

In other words — you build it once, and anyone can run it anywhere without asking you how.

&nbsp;

## Three Roles, One Workflow

Every person involved uses their own AI coding assistant (Claude Code, Cursor, etc.) and points it at this repo. The AI handles the technical details.

&nbsp;

### 1. The Vibe Coder (builds the app)

You're building an app with your AI assistant. Tell it:

> Read SPEC.md from [this repo URL] and make sure my app follows it. When I'm done, push it to a private GitHub repo.

The AI will:
- Structure your app to match the spec (or convert your existing app)
- Create a private GitHub repo and push your code
- Handle all git operations — you never need to touch git yourself
- On future sessions, push your updates to the same repo

When your app is ready for others to use, share the GitHub repo URL.

&nbsp;

### 2. The Colleague (runs their own copy)

Someone shared an app repo URL with you and you want to run it locally or deploy your own instance. Tell your AI assistant:

> I want to run this app: [GitHub repo URL]. Read SPEC.md from [this repo URL] and help me set it up.

The AI will:
- Clone the repo
- Walk you through creating the `.env` file (asking you for any API keys needed)
- Run `docker compose up`
- If the app has a settings page, tell you to open it and configure

&nbsp;

### 3. The VPS Admin (deploys apps for the team)

You manage the VPS and someone sent you a repo URL to deploy. Tell your AI assistant:

> I need to deploy this app on our VPS via Coolify: [GitHub repo URL]. Read SPEC.md from [this repo URL] for the deployment process.

The AI will:
- Guide you through connecting the GitHub repo to Coolify
- Help you set environment variables (asking you for credentials as needed)
- Deploy the app
- Set up auto-deploy so future pushes go live automatically

All three roles are described in detail in `CLAUDE.md`, which is written specifically for AI assistants to follow.

&nbsp;

## What's in the Box

| File | What it is |
|------|------------|
| [`SPEC.md`](SPEC.md) | The technical spec. What makes an app deployment-ready. |
| [`boilerplate/`](boilerplate/) | A working Python/Flask starter that follows the spec. Copy and build on it. |
| [`CLAUDE.md`](CLAUDE.md) | Role-based workflows for AI assistants helping each team member. |
| [`SKILLS-GUIDE.md`](SKILLS-GUIDE.md) | Bonus: how to create and share reusable Claude Code skills. |

&nbsp;

## Stack

- **Python 3.12 + Flask** for the app
- **Docker Compose** for running everything
- **GitHub** for private repos (AI handles all git)
- **Coolify** on VPS for deployment

&nbsp;

## Principles

- **One command to run.** `docker compose up`. Locally and in production.
- **Zero code changes to deploy.** The same docker-compose.yml works everywhere.
- **GUI for all settings.** Users configure the app from a browser, never by editing `.env` or restarting containers.
- **No conflicts.** Multiple apps on one server are automatically isolated.
- **AI-first.** Every team member uses an AI assistant. The spec and workflows are written for AI to read and execute.

&nbsp;

## Contributing

If you've been bitten by the "works on my machine" problem with vibe-coded apps, PRs and ideas are welcome.

&nbsp;

## License

MIT
