#!/usr/bin/env node
// node check.js            تقرير تقدّمك
// node check.js --json     نفس الكلام كـ JSON
// node check.js --md       markdown، للصق في الـ showcase PR
//
// السكريبت ده بيدوّر على الحاجات اللي كل يوم المفروض يسيبها وراه.
// مش بيحكم على جودة شغلك — بيقول موجود ولا مش موجود بس.
// علامة ✓ مش شهادة؛ هي إن الملف اتعمل. اللي بيفرق هو اللي جوّه الملف.

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

// ── اليوم 3 — CLAUDE.md و rules
{
  const n = await lines("CLAUDE.md");
  add(3, "CLAUDE.md", n > 0 && n < 200,
    n === 0 ? "مش موجود" : n >= 200 ? `${n} سطر — أطول من 200` : `${n} سطر`);
  const rules = await ls(".claude", "rules");
  add(3, ".claude/rules/", rules.length > 0,
    rules.length ? `${rules.length} ملف` : "فاضي");
}

// ── اليوم 5 و6 — Skills
{
  const skills = await countFiles(".claude/skills", ".md");
  add(5, ".claude/skills/", skills.length >= 1, skills.length ? skills.join("، ") : "مفيش");
  add(6, "skillين على الأقل", skills.length >= 2, `${skills.length}`);
}

// ── اليوم 5 — الـ log
{
  let n = 0;
  try {
    n = (await readFile(p("logs", "checks.log"), "utf8")).split("\n").filter(Boolean).length;
  } catch {}
  add(5, "logs/checks.log", n >= 20, n ? `${n} سطر` : "مفيش — شغّل السيرفر واستخدمه");
}

// ── اليوم 7 — MCP server
{
  const mcp = (await ls("tools")).filter((f) => /mcp/i.test(f));
  add(7, "MCP server", mcp.length > 0, mcp.length ? mcp.join("، ") : "مفيش في tools/");
}

// ── اليوم 9 — hooks
{
  let hooks = [];
  try {
    const s = JSON.parse(await readFile(p(".claude", "settings.json"), "utf8"));
    hooks = Object.keys(s.hooks ?? {});
  } catch {}
  add(9, "hooks", hooks.length >= 3,
    hooks.length ? hooks.join("، ") : "مفيش في .claude/settings.json");
}

// ── اليوم 10 — subagents
{
  const agents = await countFiles(".claude/agents", ".md");
  add(10, ".claude/agents/", agents.length >= 2, agents.length ? agents.join("، ") : "مفيش");
}

// ── اليوم 11 و12 — القواعد والرقم
{
  let ruleCount = 0, planned = 0;
  try {
    const m = await import(p("lib", "rules.js") + `?t=${Date.now()}`);
    ruleCount = m.rules?.length ?? 0;
    planned = m.PLANNED?.length ?? 0;
  } catch {}
  add(11, "القواعد", ruleCount > 2, `${ruleCount} مكتوبة، ${planned} لسه`);

  let score = null;
  try {
    const { stdout } = await run("node", [p("eval", "run.js"), "--json"]);
    score = JSON.parse(stdout);
  } catch {}
  add(12, "eval", score !== null && score.passed > 10,
    score ? `${score.passed}/${score.total}` : "مبيشتغلش");
}

// ── اليوم 13 — CI
{
  const wf = await ls(".github", "workflows");
  add(13, "GitHub Action", wf.length > 0, wf.length ? wf.join("، ") : "مفيش");
}

// ── اليوم 14 — agent بالـ SDK
{
  const agentFiles = (await ls("tools")).filter((f) => /agent/i.test(f));
  add(14, "agent بالـ SDK", agentFiles.length > 0,
    agentFiles.length ? agentFiles.join("، ") : "مفيش في tools/");
}

// ── اليوم 15 — plugin
{
  add(15, "plugin", has(".claude-plugin", "plugin.json") || has("plugin.json"),
    has(".claude-plugin", "plugin.json") || has("plugin.json") ? "موجود" : "مفيش");
}

// ── tests
{
  let ok = false, detail = "مبتشتغلش";
  try {
    const { stdout, stderr } = await run("node", ["--test", "--test-reporter=tap"], { cwd: ROOT, timeout: 60000 });
    const out = stdout + stderr;
    const m = out.match(/^# pass (\d+)/m);
    const f = out.match(/^# fail (\d+)/m);
    ok = f ? Number(f[1]) === 0 : false;
    detail = m ? `${m[1]} ناجح، ${f?.[1] ?? "?"} فاشل` : "مش قادر أقرا الناتج";
  } catch (e) {
    const out = String(e.stdout ?? "") + String(e.stderr ?? "");
    const m = out.match(/^# pass (\d+)/m);
    const f = out.match(/^# fail (\d+)/m);
    if (m) { ok = Number(f?.[1] ?? 1) === 0; detail = `${m[1]} ناجح، ${f?.[1] ?? "?"} فاشل`; }
  }
  add(9, "tests", ok, detail);
}

// ── العرض
const done = checks.filter((c) => c.ok).length;
const total = checks.length;

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ done, total, checks }, null, 2));
} else if (process.argv.includes("--md")) {
  console.log(`## تقرير nass — ${done}/${total}\n`);
  console.log("| اليوم | الحاجة | | التفصيل |");
  console.log("|---|---|---|---|");
  for (const c of checks.sort((a, b) => a.day - b.day)) {
    console.log(`| ${c.day} | \`${c.id}\` | ${c.ok ? "✓" : "—"} | ${c.detail} |`);
  }
  console.log(`\n_اتولّد بـ \`node check.js --md\`_`);
} else {
  console.log("");
  for (const c of checks.sort((a, b) => a.day - b.day)) {
    const mark = c.ok ? "✓" : "—";
    const day = `day ${c.day}`.padEnd(7);
    console.log(`  ${mark}  ${day} ${c.id.padEnd(22)} ${c.detail}`);
  }
  console.log(`\n  ${done}/${total}\n`);
  if (done === total) {
    console.log("  كله موجود. افتح PR على showcase/ — الطريقة في showcase/README.md\n");
  }
}
