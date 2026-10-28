// BONUS: emails the test report after every run (passing or failing).
// Credentials come from environment variables (GitHub secrets in CI), never from the code.
//   SMTP_USER  sender account            (secret MAIL_USERNAME)
//   SMTP_PASS  password / app password   (secret MAIL_PASSWORD)
//   MAIL_TO    receiver address          (secret REPORT_EMAIL_TO)
//   SMTP_HOST  default smtp.gmail.com    SMTP_PORT  default 465
const fs = require("node:fs");
const nodemailer = require("nodemailer");

const { SMTP_USER, SMTP_PASS, MAIL_TO } = process.env;
if (!SMTP_USER || !SMTP_PASS || !MAIL_TO) {
  console.log("Email is not configured (SMTP_USER, SMTP_PASS or MAIL_TO missing). Skipping.");
  process.exit(0);
}

const file = process.argv[2] || "report-to-send.json";
if (!fs.existsSync(file)) {
  console.error(`Report file ${file} not found, nothing to send.`);
  process.exit(1);
}
const r = JSON.parse(fs.readFileSync(file, "utf8"));

const label = r.status === "passed" ? "PASSED" : "FAILED";
const sha7 = String(r.commit_sha).slice(0, 7);
const runUrl = process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
  ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : "(not available)";

const lines = [
  `Overall result : ${label}`,
  `Commit         : ${r.commit_sha}`,
  `Repository     : ${r.repository}`,
  `Branch         : ${r.branch}`,
  `Pipeline run   : ${r.pipeline_run_id}`,
  `Run page       : ${runUrl}`,
  `Time (UTC)     : ${r.timestamp}`,
  "",
  `Total ${r.summary.total}   Passed ${r.summary.passed}   Failed ${r.summary.failed}`,
  "",
  "Individual results:",
  ...r.tests.map((t) => `  [${t.result.toUpperCase()}] ${t.name}` + (t.failure_message ? `\n      Reason: ${t.failure_message}` : "")),
  "",
  "The full JSON report is attached.",
];

const port = Number(process.env.SMTP_PORT || 465);
const transport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port,
  secure: port === 465,
  auth: { user: SMTP_USER, pass: SMTP_PASS },
  tls: { rejectUnauthorized: process.env.SMTP_INSECURE_TLS !== "1" },
});

transport.sendMail({
  from: `"CI Report" <${process.env.MAIL_FROM || SMTP_USER}>`,
  to: MAIL_TO,
  subject: `[CI ${label}] ${r.repository} @ ${sha7} - ${r.summary.passed}/${r.summary.total} tests passed`,
  text: lines.join("\n"),
  attachments: [{ filename: "test-report.json", path: file }],
}).then((info) => console.log("Email sent to", MAIL_TO, "-", info.response || info.messageId))
  .catch((e) => { console.error("Email failed:", e.message); process.exit(1); });
