#!/usr/bin/env node
// node check.js            your progress report
// node check.js --json     the same as JSON
// node check.js --md       markdown, to paste into the showcase PR
//
// This script looks for what each day is supposed to leave behind.
// It doesn't judge the quality of your work — only whether something exists.
// A ✓ is not a certificate; it means the file was created. What matters is what's inside it.

import { readFile, readdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);
const ROOT = dirname(fileURLToPath(import.meta.url));
const p = (...s) => join(ROOT, ...s);

const has = (...s) => existsSync(p(...s));
async function lines(...s) {
  try {
    return (await readFile(p(...s), "utf8")).split("\n").filter((l) => l.trim()).length;
  } catch {
    return 0;
  }
}
async function ls(...s) {
  try {
    return await readdir(p(...s));
  } catch {
    return [];
  }
}
async function countFiles(dir, ext) {
  const all = await ls(dir);
  const out = [];
  for (const name of all) {
    const full = p(dir, name);
    const st = await stat(full).catch(() => null);
    if (!st) continue;
    if (st.isDirectory()) {
      const inner = await ls(dir, name);
      if (inner.some((f) => f.endsWith(ext))) out.push(name);
    } else if (name.endsWith(ext)) out.push(name);
  }
  return out;
}

const checks = [];
const add = (day, id, ok, detail) => checks.push({ day, id, ok, detail });

// ── Day 3 — CLAUDE.md and rules
{
  const n = await lines("CLAUDE.md");
  add(3, "CLAUDE.md", n > 0 && n < 200,
    n === 0 ? "missing" : n >= 200 ? `${n} lines — over 200` : `${n} lines`);
  const rules = await ls(".claude", "rules");
  add(3, ".claude/rules/", rules.length > 0,
    rules.length ? `${rules.length} files` : "empty");
}

// ── Days 5 and 6 — Skills
{
  const skills = await countFiles(".claude/skills", ".md");
  add(5, ".claude/skills/", skills.length >= 1, skills.length ? skills.join(", ") : "none");
  add(6, "at least 2 skills", skills.length >= 2, `${skills.length}`);
}

// ── Day 5 — the log
{
  let n = 0;
  try {
    n = (await readFile(p("logs", "checks.log"), "utf8")).split("\n").filter(Boolean).length;
  } catch {}
  add(5, "logs/checks.log", n >= 20, n ? `${n} lines` : "none — run the server and use it");
}

// ── Day 7 — MCP server
{
  const mcp = (await ls("tools")).filter((f) => /mcp/i.test(f));
  add(7, "MCP server", mcp.length > 0, mcp.length ? mcp.join(", ") : "none in tools/");
}

// ── Day 9 — hooks
{
  let hooks = [];
  try {
    const s = JSON.parse(await readFile(p(".claude", "settings.json"), "utf8"));
    hooks = Object.keys(s.hooks ?? {});
  } catch {}
  add(9, "hooks", hooks.length >= 3,
    hooks.length ? hooks.join(", ") : "none in .claude/settings.json");
}

// ── Day 10 — subagents
{
  const agents = await countFiles(".claude/agents", ".md");
  add(10, ".claude/agents/", agents.length >= 2, agents.length ? agents.join(", ") : "none");
}

// ── Days 11 and 12 — the rules and the score
{
  let ruleCount = 0, planned = 0;
  try {
    const m = await import(p("lib", "rules.js") + `?t=${Date.now()}`);
    ruleCount = m.rules?.length ?? 0;
    planned = m.PLANNED?.length ?? 0;
  } catch {}
  add(11, "rules", ruleCount > 2, `${ruleCount} written, ${planned} to go`);

  let score = null;
  try {
    const { stdout } = await run("node", [p("eval", "run.js"), "--json"]);
    score = JSON.parse(stdout);
  } catch {}
  add(12, "eval", score !== null && score.passed > 10,
    score ? `${score.passed}/${score.total}` : "not running");
}

// ── Day 13 — CI
{
  const wf = await ls(".github", "workflows");
  add(13, "GitHub Action", wf.length > 0, wf.length ? wf.join(", ") : "none");
}

// ── Day 14 — an Agent SDK agent
{
  const agentFiles = (await ls("tools")).filter((f) => /agent/i.test(f));
  add(14, "Agent SDK agent", agentFiles.length > 0,
    agentFiles.length ? agentFiles.join(", ") : "none in tools/");
}

// ── Day 15 — plugin
{
  add(15, "plugin", has(".claude-plugin", "plugin.json") || has("plugin.json"),
    has(".claude-plugin", "plugin.json") || has("plugin.json") ? "present" : "none");
}

// ── tests
{
  let ok = false, detail = "not running";
  try {
    const { stdout, stderr } = await run("node", ["--test", "--test-reporter=tap"], { cwd: ROOT, timeout: 60000 });
    const out = stdout + stderr;
    const m = out.match(/^# pass (\d+)/m);
    const f = out.match(/^# fail (\d+)/m);
    ok = f ? Number(f[1]) === 0 : false;
    detail = m ? `${m[1]} passed, ${f?.[1] ?? "?"} failed` : "couldn't read the output";
  } catch (e) {
    const out = String(e.stdout ?? "") + String(e.stderr ?? "");
    const m = out.match(/^# pass (\d+)/m);
    const f = out.match(/^# fail (\d+)/m);
    if (m) { ok = Number(f?.[1] ?? 1) === 0; detail = `${m[1]} passed, ${f?.[1] ?? "?"} failed`; }
  }
  add(9, "tests", ok, detail);
}

// ── Output
const done = checks.filter((c) => c.ok).length;
const total = checks.length;

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ done, total, checks }, null, 2));
} else if (process.argv.includes("--md")) {
  console.log(`## nass report — ${done}/${total}\n`);
  console.log("| Day | Item | | Detail |");
  console.log("|---|---|---|---|");
  for (const c of checks.sort((a, b) => a.day - b.day)) {
    console.log(`| ${c.day} | \`${c.id}\` | ${c.ok ? "✓" : "—"} | ${c.detail} |`);
  }
  console.log(`\n_Generated by \`node check.js --md\`_`);
} else {
  console.log("");
  for (const c of checks.sort((a, b) => a.day - b.day)) {
    const mark = c.ok ? "✓" : "—";
    const day = `day ${c.day}`.padEnd(7);
    console.log(`  ${mark}  ${day} ${c.id.padEnd(22)} ${c.detail}`);
  }
  console.log(`\n  ${done}/${total}\n`);
  if (done === total) {
    console.log("  Everything is in place. Open a PR to showcase/ — see showcase/README.md\n");
  }
}
