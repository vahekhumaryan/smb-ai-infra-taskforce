# How to Turn Your Claude Wins into Reusable Skills

You just had an a-ha moment in Claude. Maybe you figured out the perfect way to summarize meeting notes, or you nailed a workflow for cleaning up messy data files. It works great — but next week you'll forget exactly how you prompted it.

A skill lets you save that workflow so you (or anyone on your team) can re-run it with a single slash command.

---

## What a Skill Looks Like

It's just a text file in a specific folder. That's it.

```
.claude/skills/summarize-notes/
└── SKILL.md
```

And `SKILL.md` is just your instructions written out:

```markdown
---
name: summarize-notes
description: Summarize meeting notes into action items and decisions.
---

Take the meeting notes I provide and produce:

1. A one-paragraph summary
2. A bulleted list of decisions made
3. A bulleted list of action items with owners and deadlines

Keep it concise. Use the exact names of people mentioned. If a deadline isn't stated, write "TBD".
```

Now anyone can type `/summarize-notes` and get the same result you got.

---

## How to Create One

**Step 1:** You just did something that worked well in Claude. Before you close the session, think: what were the key instructions that made this work?

**Step 2:** Create the folder and file:

```bash
mkdir -p .claude/skills/my-skill-name
```

**Step 3:** Write the `SKILL.md` with your instructions. Be specific — write it the way you'd explain the task to a smart colleague who has never done it before.

**Step 4:** Test it by typing `/my-skill-name` in a new session.

---

## Where to Put It

| Location | Who can use it |
|----------|---------------|
| `my-project/.claude/skills/` | Anyone working in this project |
| `~/.claude/skills/` | Just you, across all your projects |

For team use, commit the `.claude/skills/` folder to your project's git repo. Everyone who clones the repo gets the skills automatically.

---

## Tips for Writing Good Skills

**Be specific, not clever.** Write out the exact steps. If your a-ha moment was "oh, I need to ask Claude to check for X before doing Y" — put that in the skill.

**Include examples if it helps.** You can add example inputs/outputs right in the `SKILL.md`:

```markdown
## Example

Input: "Q3 planning meeting - John said we should delay the launch to October..."

Output:
**Summary:** The team discussed Q3 timelines and agreed to push the launch to October.
**Decisions:** Launch delayed to October (proposed by John, agreed by all)
**Action items:** John — update roadmap by Friday
```

**Add supporting files if needed.** Put templates, reference docs, or example configs next to `SKILL.md` in the same folder. Claude can read them.

```
.claude/skills/my-skill/
├── SKILL.md
├── template.md
└── example-output.md
```

---

## The Frontmatter

The `---` block at the top of `SKILL.md` just needs two things:

```yaml
---
name: my-skill-name
description: When should Claude suggest this skill.
---
```

- **name** — becomes the slash command (`/my-skill-name`)
- **description** — Claude reads this to know when to suggest the skill on its own

If you only want the skill to run when someone explicitly types the slash command (not auto-suggested), add:

```yaml
---
name: my-skill-name
description: What this does.
disable-model-invocation: true
---
```

That's all you need to know.
