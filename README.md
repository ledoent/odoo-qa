# odoo-qa

Browser smoke and E2E workflow tests for any Odoo 18/19+ instance. Point it at a URL, it auto-detects installed modules, verifies every app loads, runs key business workflows, and produces screenshots + JUnit XML for CI.

Run after unit tests pass — on fresh installs, post-migration, or post-module-install.

## Quick start

### Docker (recommended)

```bash
docker pull ghcr.io/ledoent/odoo-qa:latest

# Run against any Odoo instance
docker run --rm \
  -e ODOO_URL=https://staging.example.com \
  -e ODOO_USER=admin \
  -e ODOO_PASSWORD=secret \
  -v $(pwd)/results:/qa/test-results \
  ghcr.io/ledoent/odoo-qa:latest

# Or with docker compose
ODOO_URL=http://host.docker.internal:8069 docker compose run --rm qa
```

### Local (without Docker)

```bash
npm install
npx playwright install chromium

ODOO_URL=http://localhost:8069 npm test        # all tests
ODOO_URL=http://localhost:8069 npm run test:smoke    # smoke only
ODOO_URL=http://localhost:8069 npm run test:workflow # workflows only
npm run report                                  # view HTML report
```

## Configuration

All config via environment variables — no files to edit.

| Variable | Default | Description |
|----------|---------|-------------|
| `ODOO_URL` | `http://localhost:8069` | Odoo instance URL |
| `ODOO_USER` | `admin` | Login username |
| `ODOO_PASSWORD` | `admin` | Login password |
| `ODOO_DB` | *(auto-detect)* | Database name (required if multiple DBs) |

## What it tests

The suite auto-detects installed modules via JSON-RPC and **skips tests for modules that aren't installed**.

### Smoke tests (01-12) — verify apps load

| Spec | Module | What it checks |
|------|--------|----------------|
| 01 | *(core)* | Web client, app switcher, settings, users |
| 02 | `contacts` | List, form, search |
| 03 | `sale` | Quotations, orders, products |
| 04 | `account` | Dashboard, invoices, journal entries, chart of accounts |
| 05 | `stock` | Dashboard, deliveries, products |
| 06 | `crm` | Pipeline, leads, opportunities |
| 07 | `hr` | Employees, departments |
| 08 | `project` | Projects, tasks |
| 09 | `mrp` | Dashboard, MOs, BoMs |
| 10 | `purchase` | Dashboard, POs |
| 11 | `website` | Homepage, contact page |
| 12 | *(perf)* | Page load timing for 8 key views (10s threshold) |

### Workflow tests (20-92) — exercise real business flows

Each workflow spec creates records, clicks through multi-step processes, and verifies results via both UI and JSON-RPC backend calls.

**Revenue cycle (20-29)**

| Spec | Workflow |
|------|----------|
| 20 | CRM: Lead → Opportunity → Won |
| 21 | Sales: Create quote → Add product → Confirm SO → Verify delivery |
| 22 | Inventory: Validate delivery order (RPC setup) |
| 23 | Accounting: Create invoice from SO → Confirm → Register payment |
| 24 | Credit note from posted invoice |
| 25 | Partial invoicing: deliver 5 of 10, invoice delivered qty |
| 26 | Internal transfer between stock locations |
| 27 | Inventory adjustment (physical count) |
| 28 | Bank reconciliation view |
| 29 | Financial reports: P&L, Balance Sheet, General Ledger, Aged Receivable |

**Procurement (30-37)**

| Spec | Workflow |
|------|----------|
| 30 | Purchase: RFQ → Confirm PO → Receive goods |
| 31 | Vendor bill from PO after receipt |
| 32 | Purchase return (receive then return) |
| 33 | Dropshipping routes config |
| 34 | Sales teams config |
| 35 | Analytic accounting plans |
| 36 | Payment providers config |
| 37 | Expense re-invoicing products |

**Manufacturing (40-41)**

| Spec | Workflow |
|------|----------|
| 40 | MO → Confirm → Produce |
| 41 | MO with BoM component verification + consume |

**HR & operations (50-59)**

| Spec | Workflow |
|------|----------|
| 50 | Create employee |
| 51 | Create + submit expense |
| 52 | Attendance check in/out |
| 53 | Employee skills tab |
| 54 | Fleet: vehicle + odometer |
| 55 | Lunch menu |
| 56 | Maintenance request |
| 57 | Work location scheduling |
| 58 | Org chart view |
| 59 | Digest KPI emails config |

**Project & productivity (60-72)**

| Spec | Workflow |
|------|----------|
| 60 | Create project + task |
| 61 | Task stage transitions |
| 62 | Personal to-do |
| 70 | Website homepage + contact form |
| 71 | Event management |
| 72 | Calendar event scheduling |

**Config & reports (80-87)**

| Spec | Workflow |
|------|----------|
| 80 | Company settings |
| 81 | Users list, user form, apps/modules |
| 82 | Email/technical config |
| 83 | Sales analysis report + pivot view |
| 84 | Inventory valuation + stock moves reports |
| 85 | Purchase analysis report |
| 86 | CRM pipeline analysis |
| 87 | Spreadsheet dashboards |

**Cross-module E2E (90-92)**

| Spec | Workflow |
|------|----------|
| 90 | **Order-to-Cash**: SO → Delivery → Invoice → Payment (4 serial steps) |
| 91 | **Procure-to-Pay**: PO → Receipt → Vendor Bill → Payment |
| 92 | **Make-to-Order**: SO → MO → Produce → Deliver |

## Architecture

- **Self-contained specs** — each file creates its own prerequisites via RPC. No cross-file state.
- **`test.describe.serial()`** — multi-step workflows run in order; if step 1 fails, steps 2-N skip.
- **Shard-safe** — `--shard=N/M` splits at file level. No cross-file dependencies.
- **Module auto-detection** — JSON-RPC to `ir.module.module` at startup. Cached in `.cache/modules.json`.
- **RPC verification** — after UI actions, backend state is verified via JSON-RPC (e.g., SO state = 'sale').
- **Selector constants** — Odoo-specific selectors extracted to `S.field()`, `S.autocompleteItem`, etc.
- **Modal handling** — `confirmDialogs()` handles Odoo's multi-modal sequences.

## Output

```
test-results/
├── report/index.html     # Playwright HTML report — open this
├── junit.xml             # JUnit XML — parsed by GitHub/GitLab CI for inline results
├── checkpoints/          # Screenshot of every view visited (always captured)
├── artifacts/            # Failure screenshots, videos, traces (on failure only)
```

**JUnit XML** is the key CI integration file — both GitHub Actions and GitLab CI parse it to show test results inline in merge/pull requests.

## CI integration

### GitHub Actions

#### Manual trigger

Go to Actions → "Odoo Smoke Tests" → Run workflow. Enter the URL and credentials.

#### Call from another workflow

```yaml
jobs:
  deploy:
    # ... your deploy/migration job ...

  smoke-test:
    needs: deploy
    uses: ledoent/odoo-qa/.github/workflows/smoke-test.yml@main
    with:
      odoo_url: https://staging.example.com
      odoo_user: admin
      run_perf: true
    secrets:
      odoo_password: ${{ secrets.ODOO_PASSWORD }}
```

#### Artifacts

| Artifact | When | Contents |
|----------|------|----------|
| `qa-report` | Always | HTML report |
| `qa-failures` | On failure | Screenshots + video + trace per failed test |
| `qa-checkpoints` | Always | Checkpoint screenshots of every view |
| `qa-junit` | Always | JUnit XML for CI test reporting |
| `qa-modules` | Always | JSON of detected installed modules |

### GitLab CI

Use the GHCR image directly:

```yaml
odoo-qa:
  stage: test
  image: ghcr.io/ledoent/odoo-qa:latest
  variables:
    ODOO_URL: https://staging.example.com
    ODOO_PASSWORD: $ODOO_PASSWORD  # set in CI/CD > Variables, masked
  script:
    - mkdir -p test-results/checkpoints .auth .cache
    - node scripts/detect-modules.mjs > .cache/modules.json || true
    - npx playwright test --grep-invert "perf:" || true
  artifacts:
    when: always
    paths: [test-results/]
    reports:
      junit: test-results/junit.xml
```

See `.gitlab-ci.example.yml` for a complete template.

## npm scripts

| Script | Description |
|--------|-------------|
| `npm test` | All tests (smoke + workflow + perf) |
| `npm run test:smoke` | Smoke tests only |
| `npm run test:workflow` | Workflow tests only |
| `npm run test:perf` | Performance tests only |
| `npm run test:interactive` | Headed browser with Playwright Inspector |
| `npm run test:headed` | Headed browser (no debug) |
| `npm run report` | Open the HTML report |
| `npm run detect` | Print installed modules JSON |

## Adding tests for new modules

1. Create `specs/NN-modulename.spec.ts`
2. Add `odoo.skipUnless(test, "module_name")` at the top of each test
3. Write tests using the fixtures:

**Smoke fixture** (`fixtures/odoo.ts`): `openApp()`, `openMenuPath()`, `waitForLoaded()`, `clickButton()`, `openFirstRecord()`, `expectView()`, `expectMinRecords()`, `checkpoint()`, `skipUnless()`

**Workflow fixture** (`fixtures/workflow.ts`): Extends smoke with `fillField()`, `fillMany2one()`, `clickStatusBarButton()`, `confirmDialog()`, `confirmDialogs()`, `getCurrentRecordId()`, `saveForm()`, `clickNew()`, `getFieldValue()`, `switchToListView()`, `openReport()`

**RPC client** (`fixtures/odoo-rpc.ts`): `searchRead()`, `create()`, `write()`, `unlink()`, `callMethod()`, `findDemoPartner()`, `findDemoProduct()`, `findDemoVendor()`, `createConfirmedSO()`, `createConfirmedPO()`, `getPickings()`, `getSOInvoices()`, `OdooRPC.odooDatetime()`

## File numbering convention

```
01-12:  Smoke tests
20-29:  Revenue cycle workflows
30-39:  Procurement + config workflows
40-49:  Manufacturing workflows
50-59:  HR + operations workflows
60-69:  Project + productivity workflows
70-79:  Website + events workflows
80-89:  Configuration + reports
90-99:  Cross-module E2E integration
```
