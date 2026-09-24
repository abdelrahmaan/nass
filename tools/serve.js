#!/usr/bin/env node
// node tools/serve.js   →  http://localhost:8080
//
// server صغير من مكتبات Node نفسها — مفيش npm install.
// بيقدّم الصفحة، وبيكتب سطر في logs/checks.log على كل طلب تصحيح.
// الـ log ده مش زينة: اليوم 6 بيقراه.

import { createServer } from "node:http";
import { readFile, appendFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, extname, normalize as normPath } from "node:path";
import { check } from "../lib/normalize.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const PORT = Number(process.env.PORT) || 8080;
const LOG = join(ROOT, "logs", "checks.log");

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

async function logLine(entry) {
  await mkdir(dirname(LOG), { recursive: true });
  await appendFile(LOG, JSON.stringify(entry) + "\n", "utf8");
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "POST" && url.pathname === "/check") {
    let body = "";
    for await (const chunk of req) body += chunk;
    const started = performance.now();
    let payload;
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      res.writeHead(400, TYPES[".json"]);
      return res.end(JSON.stringify({ error: "JSON مش مظبوط" }));
    }
    const text = String(payload.text ?? "");
    const { output, applied } = check(text);
    const ms = +(performance.now() - started).toFixed(2);

    await logLine({
      at: new Date().toISOString(),
      chars: text.length,
      applied,
      changed: output !== text,
      ms,
    });

    res.writeHead(200, { "Content-Type": TYPES[".json"] });
    return res.end(JSON.stringify({ output, applied, ms }));
  }

  // ملفات ثابتة، محبوسة جوّه الـ repo
  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = join(ROOT, normPath(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("ممنوع");
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("مش موجود");
  }
});

server.listen(PORT, () => {
  console.log(`\n  nass شغّال على  http://localhost:${PORT}`);
  console.log(`  الـ log بيتكتب في  logs/checks.log\n`);
});
