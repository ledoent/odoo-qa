# odoo-qa

Browser smoke tests for any Odoo 18/19+ instance. Point it at a URL, it verifies every installed app loads and key workflows work. Screenshots on failure for human review.

Run after unit tests pass — on fresh installs, post-migration, or post-module-install.

## Usage

### Docker (recommended)

```bash
# Against a local Odoo instance
ODOO_URL=http://host.docker.internal:8069 docker compose run --rm qa

# Against a remote instance with custom creds
ODOO_URL=https://staging.example.com \
ODOO_USER=admin \
ODOO_PASSWORD=mysecret \
docker compose run --rm qa

# Performance tests only
ODOO_URL=http://host.docker.internal:8069 docker compose run --rm qa-perf

# View the report
open test-results/report/index.html
```

### Local (without Docker)

```bash
npm install
npx playwright install chromium

# Smoke tests (skip perf)
ODOO_URL=http://localhost:8069 npm run test:smoke

# All tests including perf
ODOO_URL=http://localhost:8069 npm test

# View report
npm run report
```

## Configuration

All config is via environment variables — no config files to edit.

| Variable | Default | Description |
|----------|---------|-------------|
| `ODOO_URL` | `http://localhost:8069` | Odoo instance URL |
| `ODOO_USER` | `admin` | Login username |
| `ODOO_PASSWORD` | `admin` | Login password |
| `ODOO_DB` | *(auto-detect)* | Database name (required if multiple DBs) |

## What it tests

The suite auto-detects installed modules via JSON-RPC and **skips tests for modules that aren't installed**. No configuration needed.

| Spec | Requires | What it checks |
|------|----------|----------------|
| 01-core | *(always)* | Web client loads, app switcher, settings, users list |
| 02-contacts | `contacts` | List view, open form, search |
| 03-sales | `sale` | Quotations, sale orders, products catalog |
| 04-accounting | `account` | Dashboard, invoices, journal entries, chart of accounts |
| 05-inventory | `stock` | Dashboard, delivery orders, products |
| 06-crm | `crm` | Pipeline kanban, leads list, open opportunity |
| 07-hr | `hr` | Employee kanban, open employee, departments |
| 08-project | `project` | Project kanban, open project, all tasks |
| 09-manufacturing | `mrp` | Dashboard, manufacturing orders, bills of materials |
| 10-purchase | `purchase` | Dashboard, purchase orders |
| 11-website | `website` | Homepage, contact page |
| 12-perf | *(always)* | Page load time for 8 key views (10s threshold) |

## Output

After a run, `test-results/` contains:

```
test-results/
├── report/index.html     # Playwright HTML report — open this
├── checkpoints/          # Screenshot of every view visited (always)
├── artifacts/            # Failure screenshots, videos, traces (on failure only)
```

## GitHub Actions

### Manual trigger (workflow_dispatch)

Go to Actions → "Odoo Smoke Tests" → Run workflow. Enter the URL and credentials.

### Call from another workflow

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

### Artifacts uploaded

| Artifact | When | Contents |
|----------|------|----------|
| `qa-report` | Always | HTML report |
| `qa-failures` | On failure | Screenshots + video + trace per failed test |
| `qa-checkpoints` | Always | Checkpoint screenshots of every view |
| `qa-modules` | Always | JSON of detected installed modules |

## npm scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all tests (smoke + perf) |
| `npm run test:smoke` | Smoke tests only (skip perf) |
| `npm run test:perf` | Performance tests only |
| `npm run test:headed` | Run with visible browser (debugging) |
| `npm run report` | Open the HTML report |
| `npm run detect` | Print installed modules JSON |

## Adding tests for new modules

1. Create `specs/NN-modulename.spec.ts`
2. Add `test.beforeEach(async ({ odoo }) => odoo.skipUnless(test, "module_name"));`
3. Write tests using the `odoo` fixture (`openApp`, `openMenu`, `waitForLoaded`, `checkpoint`, etc.)

The fixture provides: `openApp()`, `openMenu()`, `waitForLoaded()`, `clickButton()`, `openFirstRecord()`, `expectView()`, `expectMinRecords()`, `checkpoint()`, `skipUnless()`.
