#!/usr/bin/env node
// node eval/run.js            the score + the failing cases
// node eval/run.js --json     the same as JSON, for CI
// node eval/run.js --quiet    the score only
//
// Score = the number of cases whose output matches the expected text exactly.
// This number is the only thing that says the work actually got better.

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { check } from "../lib/normalize.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const { cases } = JSON.parse(readFileSync(join(HERE, "cases.json"), "utf8"));

const results = cases.map((c) => {
  const { output } = check(c.in);
  return { ...c, got: output, pass: output === c.out };
});

const passed = results.filter((r) => r.pass).length;
const total = results.length;
const score = passed / total;

const byGroup = {};
for (const r of results) {
  byGroup[r.group] ??= { pass: 0, total: 0 };
  byGroup[r.group].total++;
  if (r.pass) byGroup[r.group].pass++;
}

if (process.argv.includes("--json")) {
  console.log(JSON.stringify({ passed, total, score, byGroup }, null, 2));
} else if (process.argv.includes("--quiet")) {
  console.log(`${passed}/${total}`);
} else {
  const pct = (score * 100).toFixed(0);
  console.log(`\n  Score: ${passed}/${total}  (${pct}%)\n`);
  for (const [g, s] of Object.entries(byGroup)) {
    const bar = "█".repeat(s.pass) + "·".repeat(s.total - s.pass);
    console.log(`  ${g.padEnd(12)} ${String(s.pass).padStart(2)}/${s.total}  ${bar}`);
  }
  const failed = results.filter((r) => !r.pass);
  if (failed.length) {
    console.log(`\n  Failing (${failed.length}):\n`);
    for (const f of failed.slice(0, 12)) {
      console.log(`  #${String(f.id).padStart(2)} [${f.group}]`);
      console.log(`      input     ${JSON.stringify(f.in)}`);
      console.log(`      expected  ${JSON.stringify(f.out)}`);
      console.log(`      got       ${JSON.stringify(f.got)}\n`);
    }
    if (failed.length > 12) console.log(`  ... and ${failed.length - 12} more\n`);
  }
}

// CI reads the exit code. --min sets the minimum score.
const minArg = process.argv.find((a) => a.startsWith("--min="));
if (minArg) {
  const min = Number(minArg.split("=")[1]);
  if (passed < min) {
    console.error(`\n  Failed: ${passed}/${total} is below the minimum of ${min}\n`);
    process.exit(1);
  }
}
