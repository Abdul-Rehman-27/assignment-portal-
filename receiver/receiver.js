// Local HTTP receiver: saves the POSTed CI test report as test-report.json
// Start with:  npm run receiver     (listens on http://localhost:5000/report)
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = process.env.RECEIVER_PORT || 5000;
const OUT = process.env.REPORT_FILE || path.join(__dirname, "..", "test-report.json");
const TOKEN = process.env.RECEIVER_TOKEN || "";

function send(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json" }).end(JSON.stringify(obj));
}

http.createServer((req, res) => {
  if (req.method === "GET" && req.url === "/") {
    res.writeHead(200).end("Receiver is running. POST reports to /report");
    return;
  }
  if (req.method !== "POST" || req.url !== "/report") return send(res, 404, { error: "not found" });
  if (TOKEN && req.headers["x-token"] !== TOKEN) return send(res, 401, { error: "unauthorized" });

  let body = "";
  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1e6) req.destroy();
  });
  req.on("end", () => {
    let report;
    try { report = JSON.parse(body); } catch { return send(res, 400, { error: "invalid JSON" }); }
    if (!report || !Array.isArray(report.tests)) return send(res, 400, { error: "invalid report" });
    fs.writeFileSync(OUT, JSON.stringify(report, null, 2));
    console.log(`[${new Date().toLocaleTimeString()}] saved ${path.resolve(OUT)}  status=${report.status}  sha=${String(report.commit_sha).slice(0, 7)}`);
    send(res, 200, { saved: true });
  });
}).listen(PORT, () => console.log(`Receiver listening on http://localhost:${PORT}/report`));
