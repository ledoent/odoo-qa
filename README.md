# odoo-qa

Browser smoke tests for any Odoo 18/19+ instance. Run after unit tests pass — on fresh installs, post-migration, or post-module-install.

## What it does

- Opens every installed app and verifies the UI loads
- Navigates key workflows (list → form, menus, search)
- Auto-detects installed modules via JSON-RPC, skips tests for uninstalled ones
- Screenshots on failure + HTML report for human review
- Checkpoint screenshots of every view for visual diff
- Performance timing with configurable thresholds

## Quick start

```bash
npm install
npx playwright install chromium

# Run against a local instance
ODOO_URL=http://localhost:8069 npx playwright test --grep-invert "perf:"

# Run with perf tests
ODOO_URL=http://localhost:8069 npx playwright test

# View the report
npx playwright show-report test-results/report
```

## Configuration

| Env var | Default | Description |
|---------|---------|-------------|
| `ODOO_URL` | `http://localhost:8069` | Instance URL |
| `ODOO_USER` | `admin` | Login username |
| `ODOO_PASSWORD` | `admin` | Login password |
| `ODOO_DB` | *(auto-detect)* | Database name |

## GitHub Actions

Trigger manually or call from another workflow:

```yaml
# In your migration/deploy pipeline:
jobs:
  smoke-test:
    uses: ledoent/odoo-qa/.github/workflows/smoke-test.yml@main
    with:
      odoo_url: https://staging.example.com
      odoo_user: admin
    secrets:
      odoo_password: ${{ secrets.ODOO_PASSWORD }}
```

Or trigger via `workflow_dispatch` in the Actions tab.

### Artifacts

| Artifact | When | Contents |
|----------|------|----------|
| `qa-report` | Always | Playwright HTML report |
| `qa-failures` | On failure | Screenshots, videos, traces of failed tests |
| `qa-checkpoints` | Always | Screenshots of every view visited |
| `qa-modules` | Always | Detected installed modules JSON |

## Module coverage

Tests auto-skip if the module isn't installed:

| Spec | Module | Tests |
|------|--------|-------|
| 01-core | *(always)* | Web client, app switcher, settings, users |
| 02-contacts | `contacts` | List, form, search |
| 03-sales | `sale` | Quotations, orders, products |
| 04-accounting | `account` | Dashboard, invoices, journal entries, CoA |
| 05-inventory | `stock` | Dashboard, deliveries, products |
| 06-crm | `crm` | Pipeline, leads, opportunities |
| 07-hr | `hr` | Employees, departments |
| 08-project | `project` | Projects, tasks |
| 09-manufacturing | `mrp` | Dashboard, MOs, BoMs |
| 10-purchase | `purchase` | Dashboard, POs |
| 11-website | `website` | Homepage, contact page |
| 12-perf | *(always)* | Page load timing for key views |

## Where this fits

```
Python unit tests (oca-ci)      ← ORM-level, per-module
Odoo JS tours                   ← built-in, tightly coupled
         ↓
odoo-qa                         ← browser-level, any instance
  Screenshots on failure
  HTML report for review
  Perf baselines
```
