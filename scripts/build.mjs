import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const output = join(root, "dist");
const publicFiles = [
  "index.html",
  "404.html",
  "style.css",
  "script.js",
  "gerador.png",
  "robots.txt",
  "sitemap.xml",
  "llms.txt",
  "CNAME"
];

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });
for (const file of publicFiles) await cp(join(root, file), join(output, file));
console.log(`Artefato público montado em ${output}`);
