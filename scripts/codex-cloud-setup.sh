#!/usr/bin/env bash
# Prepare a clean Codex Cloud container for this repository.
# This script creates test-only local infrastructure. It must never use production credentials.

set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_DIR"

if ! command -v node >/dev/null 2>&1; then
  echo "[codex-cloud] Node.js is missing. Select Node.js 22 in the environment package settings."
  exit 1
fi

NODE_MAJOR="$(node -p "process.versions.node.split('.')[0]")"
if [ "$NODE_MAJOR" -lt 22 ]; then
  echo "[codex-cloud] Node.js 22+ is required; found $(node --version)."
  exit 1
fi

if ! command -v sudo >/dev/null 2>&1; then
  echo "[codex-cloud] sudo is required by the universal image setup."
  exit 1
fi

echo "[codex-cloud] Installing locked npm dependencies..."
npm ci --no-audit --no-fund

if ! command -v psql >/dev/null 2>&1; then
  echo "[codex-cloud] Installing PostgreSQL for disposable integration tests..."
  sudo apt-get update
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-client
fi

sudo service postgresql start || sudo pg_ctlcluster --all start

CODEX_DB_USER="codex_tutor"
CODEX_DB_NAME="dhcb_codex"
CODEX_DB_PASSWORD="codex_tutor_local_only"

if ! sudo -u postgres psql -tAc "select 1 from pg_roles where rolname='${CODEX_DB_USER}'" | grep -q 1; then
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c \
    "create role ${CODEX_DB_USER} login password '${CODEX_DB_PASSWORD}'"
fi

if ! sudo -u postgres psql -tAc "select 1 from pg_database where datname='${CODEX_DB_NAME}'" | grep -q 1; then
  sudo -u postgres createdb --owner="$CODEX_DB_USER" "$CODEX_DB_NAME"
fi

export DATABASE_URL="postgresql://${CODEX_DB_USER}:${CODEX_DB_PASSWORD}@127.0.0.1:5432/${CODEX_DB_NAME}"
export MIGRATE_DATABASE_URL="$DATABASE_URL"
export NODE_ENV="test"
export SKIP_AUTH="true"
export ALLOWED_ORIGINS="http://localhost:5179"

BASHRC_MARKER="# dhcb Codex Cloud environment"
if ! grep -Fq "$BASHRC_MARKER" "$HOME/.bashrc" 2>/dev/null; then
  {
    echo ""
    echo "$BASHRC_MARKER"
    echo "export DATABASE_URL='$DATABASE_URL'"
    echo "export MIGRATE_DATABASE_URL='$MIGRATE_DATABASE_URL'"
    echo "export NODE_ENV='test'"
    echo "export SKIP_AUTH='true'"
    echo "export ALLOWED_ORIGINS='http://localhost:5179'"
  } >> "$HOME/.bashrc"
fi

echo "[codex-cloud] Applying the disposable database schema..."
npm run migrate:pg

echo "[codex-cloud] Installing Playwright Chromium..."
npx playwright install --with-deps chromium

echo "[codex-cloud] Verifying the repository bootstrap..."
npm run typecheck
npm run lint

echo "[codex-cloud] Setup complete. Production credentials were not used."
