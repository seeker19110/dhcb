#!/usr/bin/env bash
# Refresh a cached Codex Cloud container after the selected branch has been checked out.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v sudo >/dev/null 2>&1; then
  echo "[codex-cloud] sudo is required by the universal image setup."
  exit 1
fi

echo "[codex-cloud] Refreshing dependencies from package-lock.json..."
npm ci --prefer-offline --no-audit --no-fund

sudo service postgresql start || sudo pg_ctlcluster --all start

echo "[codex-cloud] Applying new idempotent migrations..."
npm run migrate:pg

echo "[codex-cloud] Refreshing the Playwright browser if required..."
npx playwright install chromium

echo "[codex-cloud] Maintenance complete."
