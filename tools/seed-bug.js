#!/usr/bin/env node
// node tools/seed-bug.js          plants a bug
// node tools/seed-bug.js --undo   removes it
//
// Day 14 needs a real bug for the agent to find and fix. This script plants a
// reproducible one in lib/normalize.js: the first rule is skipped, so `digits`
// never runs. The eval drops and the tests fail — which is the point.
//
// Don't look at the diff before the agent runs. The whole idea is that it finds it on its own.

import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const FILE = join(ROOT, "lib", "normalize.js");

const CLEAN = "  for (const rule of rules) {";
const BUGGY = "  for (const rule of rules.slice(1)) {";

const undo = process.argv.includes("--undo");
const src = await readFile(FILE, "utf8");

if (undo) {
  if (!src.includes(BUGGY)) {
    console.log("  No bug is planted.");
    process.exit(0);
  }
  await writeFile(FILE, src.replace(BUGGY, CLEAN), "utf8");
  console.log("  Removed. Run node --test and node eval/run.js to confirm.");
} else {
  if (src.includes(BUGGY)) {
    console.log("  The bug is already planted.");
    process.exit(0);
  }
  if (!src.includes(CLEAN)) {
    console.error("  lib/normalize.js has changed from the original — plant a bug by hand instead.");
    process.exit(1);
  }
  await writeFile(FILE, src.replace(CLEAN, BUGGY), "utf8");
  console.log("  Planted in lib/normalize.js.");
  console.log("  Run node eval/run.js and watch the score drop — then let the agent find it.");
}
