#!/bin/sh
# Create output directories (works with volume mounts)
mkdir -p test-results/checkpoints test-results/report test-results/artifacts test-results/diffs .auth .cache
exec npx playwright test "$@"
