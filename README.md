# nass — an Arabic text toolkit

The starter repo for the **Claude Code Path**, a free 15-day course from AIXpert:
<https://aixpertacademy.com/courses/claude-code>

A small service that fixes the most common mistakes in written Arabic: Arabic-Indic
digits, tatweel, diacritics, spacing, punctuation, and frequently misspelled words.
One page, a small server, a test suite, and an eval that gives you a number.

**Zero dependencies.** Everything comes from Node's standard library. No `npm install`.

---

## Run it

```bash
git clone https://github.com/abdelrahmaan/nass.git
cd nass
npm start            # or: node tools/serve.js
```

Then open <http://localhost:8080>.

```bash
npm test             # the tests
npm run eval         # the score
npm run check        # your progress through the path
```

You need **Node 20+**, which Claude Code requires anyway, so you most likely have it.

> Prefer your own copy? Click **Use this template** on GitHub. You get a fresh repo
> under your account with no fork history, which is what the path expects you to work in.

---

## It is incomplete on purpose

The first time you run the eval you will see:

```
Score: 10/50  (20%)
```

That is not a bug. The repo starts with two working rules — `digits` and `tatweel` —
and the rest are listed as `PLANNED` in `lib/rules.js`, waiting for you to write them.

The ceiling with every rule in place is **45/50**. The last five cases do not need a
rule; they need a morphological dictionary. Discovering that for yourself is day 12.

`eval/cases.json` is the most valuable file in the repo. Never edit an `out` value to
make a case pass — you would only be cheating yourself, and the number would stop
meaning anything.

---

## Files

| | |
|---|---|
| `index.html` · `app.js` · `style.css` | The page |
| `lib/rules.js` | The rules — **most of your work happens here** |
| `lib/normalize.js` | Runs text through the rules |
| `lib/fixes.json` | The correction dictionary — grow it |
| `eval/cases.json` | 50 cases and the expected output for each |
| `eval/run.js` | Computes the score |
| `tests/` | `node --test` |
| `tools/serve.js` | The server — also writes `logs/checks.log` |
| `tools/seed-bug.js` | Plants a bug for day 14 |
| `check.js` | Your progress report |
| `showcase/` | Show what you built when you finish |

## What is missing, and what you will build

`CLAUDE.md` · `.claude/rules/` · `.claude/skills/` · `.claude/agents/` ·
`.claude/settings.json` (hooks) · an MCP server · a GitHub Action · an agent built with the
Agent SDK · a plugin

Each one is a day in the path.

---

## Start here

If you have Claude Code, try this first:

```
Read this repo and tell me what it does and what is missing from it.
Don't edit any file.
```

Then open the [course page](https://aixpertacademy.com/courses/claude-code) and start day 1.

---

## Two things to know

**The page has a deliberate visual defect.** I won't tell you where. Day 8 is where
Claude finds it with `/chrome` and fixes it. If you spot it early, leave it until then.

**`logs/checks.log` does not exist until you use the page.** Day 6 needs it to have
content — so you have to actually use the tool, not just look at it.

---

## Contributing

- **Stuck on a day?** Open an issue with the **Stuck on a day** template.
- **Found a common Arabic mistake that is not in the eval?** Open an issue with the
  **Missing eval case** template. That is the most useful contribution you can make.
- **Finished?** See [`showcase/`](showcase/README.md).

## License

MIT. Take it, change it, use it at work. If you teach with it, say where it came from.
