# How to Turn Your Claude Wins into Reusable Skills

You just had an a-ha moment in Claude. Maybe you figured out the perfect way to summarize meeting notes, or you nailed a workflow for cleaning up messy data files. It works great — but next week you'll forget exactly how you prompted it.

A skill lets you save that workflow so you (or anyone on your team) can re-run it with a single slash command.

---

## I Just Got a Great Result — Now What?

Right there in the same session, tell Claude:

> That was perfect. Save this as a reusable skill called "summarize-notes" that I can share with my team. Put it in `.claude/skills/summarize-notes/SKILL.md`.

Claude will create the skill file for you — capturing the instructions that made it work. You don't need to write anything yourself.

If you want to refine it afterward, you can always edit the `SKILL.md` file or tell Claude to adjust it.

---

## Sharing a Skill with a Colleague

Once Claude creates the skill, you'll have a folder like this:

```
.claude/skills/summarize-notes/
└── SKILL.md
```

To share it, just send your colleague the folder. You can:
- Zip it and send via Slack/email
- Commit it to a shared git repo
- Drop it in a shared drive

That's it. One folder, one file.

---

## I Received a Skill — How Do I Use It?

Someone sent you a skill folder (or you found one in a repo). Here's how to install it:

**Option A: For one project**

Drop the folder into your project:

```
my-project/.claude/skills/summarize-notes/SKILL.md
```

The skill is now available whenever you work in that project.

**Option B: For all your projects**

Drop the folder into your personal skills directory:

```
~/.claude/skills/summarize-notes/SKILL.md
```

The skill is now available everywhere on your machine.

**Then just use it:**

```
/summarize-notes
```

That's all. No installation, no configuration. Claude picks it up automatically.

---

## What a Skill Looks Like Inside

If you're curious, `SKILL.md` is just a text file with instructions:

```markdown
---
name: summarize-notes
description: Summarize meeting notes into action items and decisions.
---

Take the meeting notes I provide and produce:

1. A one-paragraph summary
2. A bulleted list of decisions made
3. A bulleted list of action items with owners and deadlines

Keep it concise. Use the exact names of people mentioned.
If a deadline isn't stated, write "TBD".
```

The `---` block at the top tells Claude the slash command name and when to suggest it. Everything below is the actual instructions.

You can edit this file anytime to tweak the behavior.

---

## Tips

- **Be specific.** The best skills read like instructions for a smart colleague who has never done the task before.
- **Include examples.** If the output format matters, show a sample input and output right in the skill.
- **Add supporting files.** Templates, reference docs, or examples can live next to `SKILL.md` in the same folder. Claude will read them.
- **Test it.** After creating or installing a skill, open a new session and try the slash command to make sure it works the way you expect.
