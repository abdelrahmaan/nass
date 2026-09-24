// نقطة الدخول الوحيدة. الصفحة والـ eval والـ tests كلهم بينادوا check().
import { rules } from "./rules.js";

/**
 * بيمشّي النص على القواعد بالترتيب.
 * @param {string} text
 * @returns {{ output: string, applied: string[] }} النص بعد التصحيح، وأسماء القواعد اللي غيّرت فيه فعلًا
 */
export function check(text) {
  if (typeof text !== "string") throw new TypeError("check() بتاخد نص");
  let output = text;
  const applied = [];
  for (const rule of rules) {
    const next = rule.apply(output);
    if (next !== output) applied.push(rule.id);
    output = next;
  }
  return { output, applied };
}

/** فروق سطر بسطر بين نصين — الصفحة بتستخدمها في العرض. */
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
