# Claude Skills Guide

A skill is a reusable set of instructions that Claude Code can execute on demand. Think of it as a saved workflow — instead of explaining the same process every session, you define it once and invoke it with a slash command.

This guide covers how to create, share, and deploy skills for your team.

---

## For the Creator: How to Build a Skill

A skill is a folder with a `SKILL.md` file as its entry point.

**1. Create the folder and file:**

```bash
mkdir -p .claude/skills/my-skill
```

**2. Write the `SKILL.md`:**

```markdown
---
name: my-skill
description: One line explaining what this does and when to use it.
---

Your instructions go here. Be specific — Claude follows these literally.

## Steps

1. Do this first
2. Then do this
3. Finally check this
```

The `description` field is important — Claude uses it to decide when to suggest the skill automatically.

**3. Add supporting files (optional):**

You can include templates, example configs, or scripts alongside `SKILL.md` in the same folder. Claude can read them during execution.

```
.claude/skills/my-skill/
├── SKILL.md           # entry point
├── template.py        # a template file the skill references
└── example.env        # an example config
```

**4. Invoke it:**

```
/my-skill
```

Or let Claude invoke it automatically when it matches the description.

**Tip:** If you've just completed a workflow manually in a Claude session and want to capture it, write the `SKILL.md` yourself based on what worked. There is no auto-generate feature — the value is in you deciding what the repeatable steps are.

---

## For the Reuser: How to Use Someone Else's Skill

### From a project repo

If a skill is committed to a project's `.claude/skills/` directory, it's available automatically when you work in that project. Just clone the repo and the skills are there.

### From a shared skill folder

Copy the skill folder into one of these locations:

| Location | Scope |
|----------|-------|
| `.claude/skills/my-skill/` | This project only |
| `~/.claude/skills/my-skill/` | All your projects on this machine |

### From a plugin

If the skill is packaged as a plugin and published to a marketplace:

```
/plugin install plugin-name@marketplace-name
```

---

## For the Admin: Making Skills Available to the Team

### Option A: Commit to the project repo

The simplest approach. Put shared skills in the project's `.claude/skills/` directory and commit them to git. Every team member who clones the repo gets the skills automatically.

```
my-app/
├── .claude/
│   └── skills/
│       ├── deploy-check/
│       │   └── SKILL.md
│       └── convert-to-spec/
│           └── SKILL.md
├── src/
└── ...
```

### Option B: Package as a plugin

For skills that should be available across multiple projects:

1. Create a plugin repository with a `skills/` directory
2. Add it to a plugin marketplace (custom or official)
3. Team members install it: `/plugin install my-plugin@my-marketplace`

### Option C: Organization-wide via managed settings

For enforcing skills across all team members (requires Claude Teams or Enterprise plan):

1. Package skills as a plugin and publish to a marketplace
2. In the Claude.ai admin console, configure managed settings to control access
3. Permission rules for skills follow this pattern:

```
Skill(deploy-check)     # allow or deny a specific skill
Skill(dangerous-skill)  # deny rules take precedence over allow
```

Note: deny rules always take precedence over allow rules.

---

## Advanced Features

### String substitutions

Skills support dynamic variables in their content:

| Variable | What it contains |
|----------|-----------------|
| `$ARGUMENTS` | Everything the user typed after the slash command |
| `$ARGUMENTS[0]`, `$ARGUMENTS[1]` | Individual space-separated arguments |
| `${CLAUDE_SKILL_DIR}` | Path to the skill's own directory (useful for referencing supporting files) |
| `${CLAUDE_SESSION_ID}` | Current session ID |

### Run in a forked context

Add `context: fork` to run the skill in a subagent that doesn't pollute the main conversation:

```yaml
---
name: my-skill
description: Does something in isolation
context: fork
---
```

### Limit to specific paths

Use the `paths` field to only activate a skill when working in certain directories (useful for monorepos):

```yaml
---
name: my-skill
paths: ["src/backend/**"]
---
```

### Dynamic context injection

Use shell command syntax to inject dynamic content when the skill loads:

```markdown
Current git branch: !`git branch --show-current`
```

---

## Skill Ideas for This Repo

Skills that complement the SMB AI Infra Taskforce spec:

| Skill | What it does |
|-------|-------------|
| `convert-to-spec` | Reads SPEC.md and converts the current project to match it |
| `deploy-check` | Runs through the Quick Reference checklist and reports what's missing |
| `push-to-github` | Creates a private repo (or pushes to existing), handles all git |
| `setup-coolify` | Walks the VPS admin through Coolify deployment step by step |
| `add-settings` | Adds the settings system (config.py, templates, routes) to an existing app |

These can be built by adding folders to `.claude/skills/` in this repo.

---

## SKILL.md Frontmatter Reference

```yaml
---
name: skill-name                  # slash command: /skill-name
description: When to use this     # Claude reads this to decide relevance
disable-model-invocation: true    # only run when user types /skill-name
user-invocable: true              # show in slash command list (default: true)
allowed-tools: ["Read", "Bash"]   # restrict which tools the skill can use
context: fork                     # run in isolated subagent context
paths: ["src/**"]                 # only activate in matching directories
---
```

All fields except `name` are optional.
