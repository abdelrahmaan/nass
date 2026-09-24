#!/usr/bin/env node
// node tools/serve.js   →  http://localhost:8080
//
// A small server built on Node's standard library — no npm install.
// It serves the page and writes a line to logs/checks.log for every correction request.
// The log is not decoration: day 6 reads it.

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
      return res.end(JSON.stringify({ error: "Invalid JSON" }));
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

  // Static files, confined to the repo
  const rel = url.pathname === "/" ? "/index.html" : url.pathname;
  const file = join(ROOT, normPath(rel).replace(/^(\.\.[/\\])+/, ""));
  if (!file.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }
  try {
    const data = await readFile(file);
    res.writeHead(200, {
      "Content-Type": TYPES[extname(file)] ?? "application/octet-stream",
    });
    res.end(data);
  } catch {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Not found");
  }
});

server.listen(PORT, () => {
  console.log(`\n  nass is running at  http://localhost:${PORT}`);
  console.log(`  Logging to          logs/checks.log\n`);
});
