# How to Turn Your Claude Wins into Reusable Skills

You just had an a-ha moment in Claude. Maybe you figured out the perfect way to summarize meeting notes, or you nailed a workflow for cleaning up messy data files. It works great — but next week you'll forget exactly how you prompted it.

A skill lets you save that workflow so you (or anyone on your team) can re-run it with a single slash command.

---

## I Just Got a Great Result — Now What?

Right there in the same session, tell Claude:

> That was perfect. Save this as a reusable skill called "summarize-notes" that I can share with my team. Put it in `.claude/skills/summarize-notes/SKILL.md`.

Claude will create the skill file for you. You don't need to write anything yourself.

Now you can type `/summarize-notes` anytime to get the same result.

---

## Sharing a Skill with a Colleague

You'll have a folder like:

```
.claude/skills/summarize-notes/
└── SKILL.md
```

Send your colleague the `SKILL.md` file — Slack, email, whatever works.

---

## I Received a Skill — How Do I Use It?

Someone sent you a `SKILL.md` file. Give it to Claude:

> Here's a skill file my colleague shared with me. Install it so I can use it as a slash command.

Paste the file contents or attach it. Claude will put it in the right place.

Then just type `/skill-name` to use it.
