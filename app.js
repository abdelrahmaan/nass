// الواجهة. بتبعت النص للـ server وبتعرض الناتج.
// الـ server هو اللي بينادي lib/normalize.js، علشان كل تصحيح يتسجّل في الـ log.

const $ = (id) => document.getElementById(id);

const SAMPLE =
  "انشاء الله الاجتماع الساعة ٣ ، وهنراجع الملف الــكبير اللي فيه ١٢ صفحة , تمام؟؟";

$("sample").addEventListener("click", () => {
  $("input").value = SAMPLE;
  run();
});

$("run").addEventListener("click", run);

$("input").addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") run();
});

$("copy").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText($("output").textContent);
    $("copy").textContent = "اتنسخ ✓";
    setTimeout(() => ($("copy").textContent = "انسخ"), 1500);
  } catch {
    $("copy").textContent = "المتصفح مرضيش ينسخ";
  }
});

async function run() {
  const text = $("input").value;
  if (!text.trim()) return;

  $("meta").textContent = "…";
  let data;
  try {
    const res = await fetch("/check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(res.status);
    data = await res.json();
  } catch (err) {
    // بنقول اللي حصل بالظبط — مش بنسيب الشاشة فاضية
    $("meta").textContent =
      "الـ server مش رادّ. شغّل: node tools/serve.js";
    return;
  }

  $("result").hidden = false;
  $("output").textContent = data.output;
  $("meta").textContent = `${data.ms} ms`;

  renderDiff(text, data.output);
  renderApplied(data.applied);
}

function renderDiff(before, after) {
  const box = $("diff");
  box.textContent = "";
  const a = before.split(/(\s+)/);
  const b = after.split(/(\s+)/);
  const n = Math.max(a.length, b.length);
  let changes = 0;
  for (let i = 0; i < n; i++) {
    const was = a[i] ?? "";
    const now = b[i] ?? "";
    if (was === now) continue;
    changes++;
    const line = document.createElement("div");
    line.className = "diff-line";
    const del = document.createElement("span");
    del.className = "del";
    del.textContent = was;
    const ins = document.createElement("span");
    ins.className = "ins";
    ins.textContent = now;
    line.append(del, document.createTextNode(" ← "), ins);
    box.append(line);
  }
  if (!changes) {
    const p = document.createElement("p");
    p.className = "meta";
    p.textContent = "مفيش حاجة اتغيرت.";
    box.append(p);
  }
}

function renderApplied(applied) {
  const box = $("applied");
  box.textContent = "";
  if (!applied.length) {
    const p = document.createElement("p");
    p.className = "meta";
    p.textContent = "ولا قاعدة اشتغلت.";
    box.append(p);
    return;
  }
  for (const id of applied) {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = id;
    box.append(chip);
  }
}
