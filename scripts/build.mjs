// Writes the static pages from the content: `npm run build`.
// With --check it writes nothing and fails if a page is missing or out of date,
// so `npm run check` catches a content change that was never built.
import fs from "node:fs";
import path from "node:path";
import { ROOT, loadSite, renderSite } from "./site.mjs";

const checkOnly = process.argv.includes("--check");
const files = renderSite(loadSite());
const stale = [];

for (const [relativePath, html] of files) {
  const filePath = path.join(ROOT, relativePath);
  // Git may check files out with CRLF on Windows (core.autocrlf); compare the text, not the line endings.
  const current = fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8").replace(/\r\n/g, "\n") : null;

  if (current === html) {
    continue;
  }

  if (checkOnly) {
    stale.push(relativePath);
    continue;
  }

  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, html);
}

if (stale.length) {
  console.error(`Out of date, run npm run build: ${stale.join(", ")}`);
  process.exit(1);
}

console.log(checkOnly ? `Built pages are up to date (${files.size} files).` : `Built ${files.size} files.`);
