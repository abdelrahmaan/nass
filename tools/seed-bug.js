#!/usr/bin/env node
// node tools/seed-bug.js          يزرع bug
// node tools/seed-bug.js --undo   يشيله
//
// اليوم 14 محتاج bug حقيقي علشان الـ agent يلاقيه ويصلّحه. السكريبت ده بيزرع
// واحد قابل للتكرار في lib/normalize.js: أول قاعدة بتتخطّى، فالـ digits
// مابتشتغلش خالص. الـ eval هيقع، والتستات هتفشل — وده المطلوب.
//
// ماتبصّش على الـ diff قبل ما الـ agent يشتغل. الفكرة كلها إنه يلاقيه لوحده.

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
    console.log("  مفيش bug مزروع.");
    process.exit(0);
  }
  await writeFile(FILE, src.replace(BUGGY, CLEAN), "utf8");
  console.log("  اترفع. شغّل node --test و node eval/run.js للتأكيد.");
} else {
  if (src.includes(BUGGY)) {
    console.log("  الـ bug مزروع أصلًا.");
    process.exit(0);
  }
  if (!src.includes(CLEAN)) {
    console.error("  lib/normalize.js اتغيّر عن الأصل — ازرع bug بإيدك بدل ده.");
    process.exit(1);
  }
  await writeFile(FILE, src.replace(CLEAN, BUGGY), "utf8");
  console.log("  اتزرع في lib/normalize.js.");
  console.log("  شغّل node eval/run.js وشوف الرقم وقع — وبعدين سيب الـ agent يلاقيه.");
}
