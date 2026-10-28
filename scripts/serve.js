// Tiny static file server for the portal (no dependencies): npm start
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..", "public");
const PORT = process.env.PORT || 8000;
const TYPES = { ".html": "text/html", ".css": "text/css", ".js": "text/javascript" };

http.createServer((req, res) => {
  const name = req.url.split("?")[0] === "/" ? "/index.html" : req.url.split("?")[0];
  const file = path.join(ROOT, path.normalize(name));
  if (!file.startsWith(ROOT)) { res.writeHead(403).end("Forbidden"); return; }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404).end("Not found"); return; }
    res.writeHead(200, { "Content-Type": TYPES[path.extname(file)] || "text/plain" }).end(data);
  });
}).listen(PORT, () => console.log(`Portal running at http://localhost:${PORT}`));
