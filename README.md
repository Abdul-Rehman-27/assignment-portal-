# Assignment Submission Portal with Automated Testing (CSC418 Lab Midterm)

A plain HTML, CSS and JavaScript portal where students submit their name, registration number, assignment title and a submission URL.
Every push runs automated tests in GitHub Actions, and the JSON test report is delivered to a receiver running on my computer.

## Structure
| Path | Purpose |
|---|---|
| `public/` | The portal: `index.html`, `style.css`, `portal.js` (logic), `app.js` (page wiring) |
| `tests/portal.test.js` | The 3 automated test cases |
| `receiver/receiver.js` | Local HTTP receiver that saves `test-report.json` |
| `scripts/build-report.js` | Builds the JSON report from the test results and POSTs it |
| `scripts/send-email.js` | BONUS: emails the report after every run |
| `scripts/serve.js` | Tiny static server for running the portal locally |
| `.github/workflows/ci.yml` | CI pipeline (tests, report, GitHub Pages deploy) |

Requires Node.js 20 or newer (tested on Node 22).

## Run the application
```
npm ci
npm start            # http://localhost:8000
```
Valid submissions are saved in the browser's localStorage and shown in the table below the form.

## Run the tests
```
npm test
```

## Start the receiver (keep it running while CI runs)
```
npm run receiver     # listens on http://localhost:5000/report
```
Each report is saved to `test-report.json` in the project folder.

## CI and the self-hosted runner
The workflow uses `runs-on: self-hosted`, so the runner on this computer reaches the receiver at `localhost:5000`.
Register it under GitHub > Settings > Actions > Runners > New self-hosted runner, then start it with `run.cmd`.

## Report format
`repository, branch, commit_sha, pipeline_run_id, timestamp, summary{total,passed,failed}, status, tests[{name,result,failure_message}]`

## Bonus 1: conditional deployment to GitHub Pages
The `deploy-pages` job publishes `public/` to GitHub Pages. It has `needs: test` and runs only on `main`, so a failing run
skips it and the previously published version stays online. One-time setup: Settings > Pages > Source: **GitHub Actions**.
Deployed URL: https://abdul-rehman-27.github.io/assignment-portal/

## Bonus 2: email the report
`scripts/send-email.js` runs after both passing and failing runs. The email contains the commit id, overall result, the
total/passed/failed counts and every test result, with `test-report.json` attached.
Add these repository secrets (Settings > Secrets and variables > Actions):

| Secret | Value |
|---|---|
| `MAIL_USERNAME` | sender email address |
| `MAIL_PASSWORD` | password (Gmail: an App Password, needs 2-step verification) |
| `REPORT_EMAIL_TO` | address that receives the report (configurable) |
| `SMTP_HOST`, `SMTP_PORT` | optional, default `smtp.gmail.com` and `465` |

If the secrets are not set the step prints a message and is skipped.
