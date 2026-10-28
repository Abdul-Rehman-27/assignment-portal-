// Turns the JUnit XML written by `npm run test:ci` into the JSON report
// and POSTs it to the local receiver.   Usage: node scripts/build-report.js results.xml
const fs = require("node:fs");

const decode = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const attr = (tag, name) => { const m = tag.match(new RegExp(`\\b${name}="([^"]*)"`)); return m ? decode(m[1]) : ""; };

const file = process.argv[2] || "results.xml";
const xml = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";

const tests = [];
const re = /<testcase\b([^>]*?)(\/>|>([\s\S]*?)<\/testcase>)/g;
let m;
while ((m = re.exec(xml))) {
  const inner = m[3] || "";
  const failure = inner.match(/<failure\b([^>]*)>/);
  const skipped = /<skipped\b/.test(inner);
  tests.push({
    name: attr(m[1], "name"),
    result: failure ? "failed" : skipped ? "skipped" : "passed",
    failure_message: failure ? attr(failure[1], "message").slice(0, 500) : null,
  });
}

const passed = tests.filter((t) => t.result === "passed").length;
const failed = tests.filter((t) => t.result === "failed").length;
const report = {
  repository: process.env.GITHUB_REPOSITORY || "local/repo",
  branch: process.env.GITHUB_REF_NAME || "local",
  commit_sha: process.env.GITHUB_SHA || "local",
  pipeline_run_id: process.env.GITHUB_RUN_ID || "0",
  timestamp: new Date().toISOString(),
  summary: { total: tests.length, passed, failed },
  status: tests.length > 0 && failed === 0 ? "passed" : "failed",
  tests,
};
fs.writeFileSync("report-to-send.json", JSON.stringify(report, null, 2));

const url = process.env.RECEIVER_URL || "http://localhost:5000/report";
const headers = { "Content-Type": "application/json" };
if (process.env.RECEIVER_TOKEN) headers["X-Token"] = process.env.RECEIVER_TOKEN;

fetch(url, { method: "POST", headers, body: JSON.stringify(report) })
  .then(async (r) => {
    console.log("Receiver responded:", r.status, await r.text());
    if (!r.ok) process.exit(1);
  })
  .catch((e) => {
    console.error("Could not reach the receiver at " + url + ": " + e.message);
    process.exit(1);
  });
