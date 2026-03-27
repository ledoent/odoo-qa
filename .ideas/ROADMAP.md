# odoo-qa Roadmap

## Fix now (blocking CI)

- [ ] **Runboat race condition** — CI runs before runboat finishes init + scale-up
  - Add runboat API call to start build: `curl -X POST runboat.hz.ledoweb.com/builds/{name}/start`
  - Or extend wait timeout from 10min to 15min
  - Or have runboat webhook notify CI when build is ready
  - Related: runboat scale-to-zero means first request always hits cold start

- [ ] **Runboat URL construction** — need to handle fork vs upstream PR context correctly
  - `github.repository` returns upstream (OCA) on cross-repo PRs, not the fork
  - Branch dots must be dashes in URL slug (18.0 → 18-0)
  - PR number differs between fork and upstream

## Short-term improvements

- [ ] **PR comment with visual diff** — currently posts summary table but screenshots aren't inline
  - Upload changed diff PNGs to GCS with a unique path per run
  - Link them as `<img>` tags in the PR comment
  - Show before/after side-by-side for changed views

- [ ] **Embed screenshots in PR comment** — requires public URL for each image
  - GCS path: `gs://ledo-pr-assets/odoo-qa/runs/{repo}/{pr}/{run_id}/{name}.png`
  - Public URL: `https://storage.googleapis.com/ledo-pr-assets/odoo-qa/runs/...`

- [ ] **16.0 baseline** — requires adapting selectors for Odoo 16 UI
  - Different navbar structure (no `.o_navbar_apps_menu`)
  - Different widget classes
  - Different URL patterns (`/web#` instead of `/odoo/`)

- [ ] **Auto-refresh baselines** — `visual-baseline.yml` schedule (weekly cron)
  - Needs a running Odoo instance in CI (start Docker, init DB, run QA, upload to GCS)
  - Currently baselines are captured manually

## Medium-term

- [ ] **Staleness annotations in PR comments**
  - Compare module `write_date` from baseline manifest vs live instance
  - Flag when baseline is outdated: "⚠️ Baseline captured with sale 19.0.2.0, PR has 19.0.2.1"
  - `scripts/check-staleness.mjs` already exists, needs integration into CI workflow

- [ ] **Deploy to more OCA forks**
  - Add `odoo-qa.yml` workflow to: `sale-workflow`, `account-financial-tools`, `e-commerce`, `social`, `dms`, `calendar`
  - Each needs runboat URL pattern configured

- [ ] **Enterprise module support**
  - Add specs for EE modules (Helpdesk, Quality, Planning, Studio, etc.)
  - Use `ledoent/odoo-enterprise` repo for source
  - Need EE-licensed Odoo instance for testing

- [ ] **Odoo 16 selector compatibility**
  - `OdooPage` class needs version-aware selectors
  - Detect Odoo version from server response, switch selector set
  - Or maintain separate fixture files per major version

## Long-term

- [ ] **Percy/Argos integration** — AI-powered visual diff
  - Reduces false positives from anti-aliasing, font rendering
  - Understands semantic changes (button moved vs button restyled)
  - Cost: ~$99/month for Percy

- [ ] **Test data seed script** — standardized demo data
  - Version-independent test data that works on 16.0, 18.0, 19.0
  - Creates specific partners, products, SOs for deterministic testing
  - Replaces reliance on Odoo's demo data which varies between versions

- [ ] **Multi-company testing**
  - Tests that switch between companies
  - Verify company-specific data isolation
  - Test multi-company workflows (inter-company transactions)

- [ ] **Role-based testing**
  - Run specs as different user roles (Sales Manager, Accountant, HR Officer)
  - Verify access control (user can't access admin-only pages)
  - Test role-specific workflows (manager approvals)

- [ ] **Performance regression tracking**
  - Store perf timing history per Odoo version
  - Alert when page load times increase beyond threshold
  - Integrate with monitoring (Grafana dashboard)

## Architecture notes

- Baselines stored in GCS: `gs://ledo-pr-assets/odoo-qa/baselines/{version}/`
- Docker image in GAR: `us-central1-docker.pkg.dev/kendall-ledo/docker-repo/odoo-qa`
- Runboat domain: `runboat.hz.ledoweb.com`
- ARC runners: `hetzner-k3s-ledoent` label on k3s cluster
