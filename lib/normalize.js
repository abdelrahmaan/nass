// The single entry point. The page, the eval and the tests all call check().
import { rules } from "./rules.js";

/**
 * Runs the text through the rules, in order.
 * @param {string} text
 * @returns {{ output: string, applied: string[] }} the corrected text, and the ids of the rules that actually changed it
 */
export function check(text) {
  if (typeof text !== "string") throw new TypeError("check() takes a string");
  let output = text;
  const applied = [];
  for (const rule of rules) {
    const next = rule.apply(output);
    if (next !== output) applied.push(rule.id);
    output = next;
  }
  return { output, applied };
}

/** Word-by-word differences between two texts — the page uses this for display. */
export function diffWords(before, after) {
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  const out = [];
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) {
    out.push({ before: a[i] ?? "", after: b[i] ?? "", changed: a[i] !== b[i] });
  }
  return out;
}
