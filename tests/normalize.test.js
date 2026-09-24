// node --test
// No libraries — Node's own test runner.
// These tests are incomplete on purpose: every new rule you add needs a test with it.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check, diffWords } from "../lib/normalize.js";

test("converts Arabic-Indic digits to Western digits", () => {
  assert.equal(check("الساعة ٣").output, "الساعة 3");
  assert.equal(check("سنة ٢٠٢٦").output, "سنة 2026");
});

test("removes tatweel", () => {
  assert.equal(check("كــــتاب").output, "كتاب");
});

test("leaves clean text untouched", () => {
  const clean = "النص ده مفيهوش حاجة تتصلح";
  assert.equal(check(clean).output, clean);
});

test("reports which rules ran", () => {
  const { applied } = check("كــتاب رقم ٣");
  assert.deepEqual(applied.sort(), ["digits", "tatweel"]);
});

test("rejects anything that isn't a string", () => {
  assert.throws(() => check(42), TypeError);
});

test("diffWords marks the words that changed", () => {
  const d = diffWords("الساعة ٣", "الساعة 3");
  assert.equal(d.filter((w) => w.changed).length, 1);
});
