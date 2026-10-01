# MoroSystems QA Take-Home Assignment

A Playwright + TypeScript solution covering the assignment's Google/MoroSystems UI scenario and CRUD operations against the official `morosystems/todo-be` backend.

## Prerequisites

- Node.js 24 recommended, matching CI. The backend requires Node.js >=22.6.
- npm >=10.
- Git.
- Playwright browser binaries for UI execution.

API tests use Playwright's request fixture and do not require browser installation.

## Installation

After cloning or unpacking this repository:

```sh
cd morosystems-playwright-tests
npm ci
```

For UI execution, install the configured browsers:

```sh
npx playwright install
```

On Linux, use `npx playwright install --with-deps` if browser system dependencies are also needed.

## Backend setup

The API tests require the official [morosystems/todo-be](https://github.com/morosystems/todo-be) backend running separately.

In another terminal, starting from the Playwright repository directory:

```sh
cd ..
git clone https://github.com/morosystems/todo-be.git
cd todo-be
git checkout --detach 2cfa7c31aba1ee9f1086a3dcff22bae5c132952f
npm install
npm start
```

This uses the same verified revision pinned in CI. Keep the backend terminal running while executing API tests.

The backend listens at `http://localhost:8080`. Documentation is available at [Swagger](http://localhost:8080/api-docs/) and [OpenAPI JSON](http://localhost:8080/v3/api-docs).

The API project defaults to this local address. To target another instance of the same backend, set `API_BASE_URL`, for example:

```sh
API_BASE_URL=http://127.0.0.1:8080 npm run test:api
```

## Commands

Run these commands from the Playwright repository:

| Command | Purpose |
|---|---|
| `npm test` | Run API tests and all configured UI projects. |
| `npm run test:api` | Run API tests only. |
| `npm run test:ui` | Run UI tests in Chromium, Firefox, and WebKit. |
| `npm run test:ui:chromium` | Run UI tests in Chromium only. |
| `npm run typecheck` | Validate TypeScript without emitting files. |
| `npm run report` | Open the generated Playwright HTML report. |

## Test coverage

### UI

The fully automated test opens Google, searches for exactly `MoroSystems`, validates the results page and specified website result, and opens the MoroSystems website. It verifies the destination hostname, navigates to "Kariéra", selects Brno, and checks that at least one position is visible and no visible position lacks Brno in its `data-filter` attribute.

Optional cookie dialogs are handled with bounded visibility waits.

### API

One test covers the complete task lifecycle:

| Operation | Endpoint | Expected status |
|---|---|---|
| Retrieve tasks | `GET /tasks` | `200` |
| Create task | `POST /tasks` | `200` |
| Update task | `POST /tasks/{id}` | `200` |
| Delete task | `DELETE /tasks/{id}` | `200` |

Create and update requests send `{"text":"..."}`. The test validates the task list, creation fields, updated text, preservation of other task fields, persistence of the update, an empty deletion response, and absence of the deleted task.

Task text includes a UUID. A `finally` block attempts cleanup if a failure occurs after the created task's identifier has been captured.

### Observed update contract mismatch

The assignment specifies **PUT** for updating a task. At the pinned official backend revision, the implemented and documented update endpoint is **POST `/tasks/{id}`**.

Local verification confirmed that PUT against an existing task returns `404`, while POST successfully updates it. The functional test therefore uses POST. This is an observed mismatch between the assignment and the provided backend contract.

## Google Search limitation

The final UI test is fully automated. Google may return an unusual-traffic/CAPTCHA challenge instead of search results, depending on IP address, network, and request patterns. This external dependency is outside the test suite's control.

This occurred during the final automated Chromium runs in both headless and headed mode. When the required search results page is unavailable, the test correctly fails. UI tests are intentionally excluded from unattended GitHub Actions for this reliability reason.

## CI/CD

The [GitHub Actions workflow](.github/workflows/playwright.yml) is configured for pushes and pull requests targeting `main` or `master`. It:

- Installs project dependencies using Node.js 24.
- Checks out and installs the pinned official backend outside the project checkout.
- Starts the backend and polls `/tasks` for HTTP readiness with a bounded timeout.
- Validates TypeScript and runs only the API project.
- Uploads available Playwright reports, test results, and backend logs, including after failure unless cancelled, with 30-day retention.

CI does not currently execute UI projects or install browser binaries. The current workflow has not yet been executed remotely.

## Verification status

- TypeScript validation passed locally.
- API coverage passed locally: **1 test passed** against the running backend.
- The complete UI flow was successfully verified in Chromium earlier when Google search results were available.
- Final fully automated Chromium runs were blocked by Google's unusual-traffic challenge in both headless and headed mode.
- Firefox and WebKit are configured but have not been verified.

## Reporting

Playwright generates an HTML report in `playwright-report/`. Open it with `npm run report`.

The configuration enables UI screenshots on failure, UI video retained on failure, and traces on the first retry. Local runs have no retries by default; CI allows two retries. API tests do not produce browser screenshots or video.

## Project structure

```text
.github/workflows/playwright.yml
tests/
  api/tasks.spec.ts
  ui/google-search.spec.ts
package.json
package-lock.json
playwright.config.ts
tsconfig.json
README.md
```

`playwright-report/` and `test-results/` contain generated artifacts and are ignored by Git.
