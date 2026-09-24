// node --test
// مفيش مكتبات. test runner بتاع Node نفسه.
// التستات دي ناقصة عن قصد — كل قاعدة جديدة بتضيفها لازم يبقى معاها test.

import { test } from "node:test";
import assert from "node:assert/strict";
import { check, diffWords } from "../lib/normalize.js";

test("بيحوّل الأرقام العربية-الهندية لغربية", () => {
  assert.equal(check("الساعة ٣").output, "الساعة 3");
  assert.equal(check("سنة ٢٠٢٦").output, "سنة 2026");
});

test("بيشيل التطويل", () => {
  assert.equal(check("كــــتاب").output, "كتاب");
});

test("بيسيب النص السليم زي ما هو", () => {
  const clean = "النص ده مفيهوش حاجة تتصلح";
  assert.equal(check(clean).output, clean);
});

test("بيقول أنهي قواعد اشتغلت", () => {
  const { applied } = check("كــتاب رقم ٣");
  assert.deepEqual(applied.sort(), ["digits", "tatweel"]);
});

test("بيرفض أي حاجة مش نص", () => {
  assert.throws(() => check(42), TypeError);
});

test("diffWords بتعلّم الكلمات اللي اتغيرت", () => {
  const d = diffWords("الساعة ٣", "الساعة 3");
  assert.equal(d.filter((w) => w.changed).length, 1);
});
