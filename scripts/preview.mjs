import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "dist");
const port = Number(process.env.PORT || 4173);
const types = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".png": "image/png", ".xml": "application/xml; charset=utf-8", ".txt": "text/plain; charset=utf-8" };

http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url, `http://${request.headers.host}`).pathname);
  let relative = pathname === "/" ? "index.html" : pathname.replace(/^\/+/, "");
  let target = normalize(join(root, relative));
  if (!target.startsWith(normalize(root))) {
    response.writeHead(403).end("Forbidden");
    return;
  }
  try {
    if ((await stat(target)).isDirectory()) target = join(target, "index.html");
    const body = await readFile(target);
    response.writeHead(200, { "Content-Type": types[extname(target)] || "application/octet-stream" }).end(body);
  } catch {
    const body = await readFile(join(root, "404.html"));
    response.writeHead(404, { "Content-Type": types[".html"] }).end(body);
  }
}).listen(port, "127.0.0.1", () => console.log(`Preview em http://127.0.0.1:${port}`));
