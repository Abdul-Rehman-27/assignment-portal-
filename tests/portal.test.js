const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { JSDOM } = require("jsdom");

const PUBLIC = path.join(__dirname, "..", "public");
const html = fs.readFileSync(path.join(PUBLIC, "index.html"), "utf8").replace(/<script[^>]*><\/script>/g, "");
const portalSrc = fs.readFileSync(path.join(PUBLIC, "portal.js"), "utf8");
const appSrc = fs.readFileSync(path.join(PUBLIC, "app.js"), "utf8");

const VALID = {
  name: "Abdul Rehman",
  regNo: "FA23-BSE-009",
  title: "Lab Midterm",
  url: "https://github.com/Abdul-Rehman-27/assignment-portal",
};

/* Open a fresh copy of the real page (new, empty localStorage every time). */
function openPortal() {
  const dom = new JSDOM(html, { url: "http://localhost/", runScripts: "outside-only" });
  const { window } = dom;
  window.eval(portalSrc);
  window.eval(appSrc);
  window.initPortal();
  return window;
}

/* Type values into the form and submit it like a user would. */
function fillAndSubmit(window, values) {
  const form = window.document.getElementById("submission-form");
  for (const [field, value] of Object.entries(values)) form.elements[field].value = value;
  form.dispatchEvent(new window.Event("submit", { bubbles: true, cancelable: true }));
}

const messageText = (window, id) => {
  const el = window.document.getElementById(id);
  return el ? el.textContent : "";
};
const savedCount = (window) => JSON.parse(window.localStorage.getItem("assignment-submissions") || "[]").length;

test("complete details and a valid URL: submission is saved and listed", () => {
  const window = openPortal();
  fillAndSubmit(window, VALID);

  assert.match(messageText(window, "success"), /saved successfully/i, "A success message must be shown");
  assert.equal(savedCount(window), 1, "Exactly one submission must be saved");
  const rows = window.document.querySelectorAll("#submissions tbody tr");
  assert.equal(rows.length, 1);
  assert.match(rows[0].textContent, /Lab Midterm/);
  assert.match(rows[0].textContent, /FA23-BSE-009/);
});

test("missing registration number: submission is rejected with a message", () => {
  const window = openPortal();
  fillAndSubmit(window, { ...VALID, regNo: "" });

  assert.match(messageText(window, "errors"), /Registration number is required/, "A validation message for the registration number must be shown");
  assert.equal(savedCount(window), 0, "Nothing must be saved");
});

test("invalid submission URL: submission is rejected and not saved", () => {
  const window = openPortal();
  fillAndSubmit(window, { ...VALID, url: "not-a-url" });

  assert.match(messageText(window, "errors"), /not a valid/i, "An invalid URL must be rejected with a validation message");
  assert.equal(savedCount(window), 0, "Nothing must be saved");
  assert.match(window.document.querySelector("#submissions tbody").textContent, /No submissions yet/);
});
