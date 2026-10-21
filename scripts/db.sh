#!/usr/bin/env bash
#
# Local PostgreSQL control for NeevPass.
#
# Docker is not available on this machine and `brew services` cannot bootstrap
# under a restricted sandbox, so we run a dedicated cluster inside the repo at
# ./.pgdata. It is gitignored and never leaves your machine.
#
# Usage: bash scripts/db.sh {start|stop|status|init|reset|psql}
#
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PGDATA="${REPO_ROOT}/.pgdata"
LOGFILE="/tmp/neevpass-postgres.log"
PORT="${PGPORT:-5432}"
DEV_DB="neevpass_dev"
TEST_DB="neevpass_test"

# Locate the Homebrew PostgreSQL 17 binaries.
find_pg_bin() {
  for candidate in \
    /opt/homebrew/opt/postgresql@17/bin \
    /usr/local/opt/postgresql@17/bin \
    "$(dirname "$(command -v pg_ctl 2>/dev/null || echo /nonexistent)")"
  do
    if [ -x "${candidate}/pg_ctl" ]; then
      echo "${candidate}"
      return 0
    fi
  done
  echo "ERROR: could not find pg_ctl. Install PostgreSQL 17: brew install postgresql@17" >&2
  return 1
}

PG_BIN="$(find_pg_bin)"

# macOS PostgreSQL aborts at startup ("postmaster became multithreaded") when the
# locale is unset or invalid. Pin a known-good UTF-8 locale for every command.
export LC_ALL="${LC_ALL:-en_US.UTF-8}"
export LANG="${LANG:-en_US.UTF-8}"

is_running() {
  "${PG_BIN}/pg_isready" -h localhost -p "${PORT}" -q >/dev/null 2>&1
}

cmd_init() {
  if [ -d "${PGDATA}" ]; then
    echo "Cluster already initialised at ${PGDATA}"
    return 0
  fi
  echo "Initialising cluster at ${PGDATA} ..."
  "${PG_BIN}/initdb" \
    -D "${PGDATA}" \
    -U postgres \
    --auth=trust \
    --encoding=UTF8 \
    --locale=en_US.UTF-8 >/dev/null
  echo "Cluster initialised."
}

cmd_start() {
  if is_running; then
    echo "PostgreSQL already running on port ${PORT}."
    return 0
  fi
  cmd_init
  echo "Starting PostgreSQL on port ${PORT} ..."
  "${PG_BIN}/pg_ctl" -D "${PGDATA}" -l "${LOGFILE}" -o "-p ${PORT}" -w start >/dev/null
  cmd_databases
  echo "Ready. Logs: ${LOGFILE}"
}

cmd_databases() {
  for db in "${DEV_DB}" "${TEST_DB}"; do
    if ! "${PG_BIN}/psql" -h localhost -p "${PORT}" -U postgres -lqt 2>/dev/null \
        | cut -d '|' -f 1 | grep -qw "${db}"; then
      echo "Creating database ${db} ..."
      "${PG_BIN}/psql" -h localhost -p "${PORT}" -U postgres -d postgres \
        -c "CREATE DATABASE ${db};" >/dev/null
    fi
  done
}

cmd_stop() {
  if ! is_running; then
    echo "PostgreSQL is not running."
    return 0
  fi
  "${PG_BIN}/pg_ctl" -D "${PGDATA}" -m fast -w stop >/dev/null
  echo "Stopped."
}

cmd_status() {
  if is_running; then
    echo "running on port ${PORT}"
    "${PG_BIN}/psql" -h localhost -p "${PORT}" -U postgres -d postgres -c "\l" \
      | grep -E "${DEV_DB}|${TEST_DB}" || true
  else
    echo "not running"
    exit 1
  fi
}

cmd_reset() {
  cmd_stop || true
  echo "Removing ${PGDATA} ..."
  rm -rf "${PGDATA}"
  cmd_start
}

cmd_psql() {
  shift || true
  "${PG_BIN}/psql" -h localhost -p "${PORT}" -U postgres -d "${DEV_DB}" "$@"
}

case "${1:-}" in
  start)  cmd_start ;;
  stop)   cmd_stop ;;
  status) cmd_status ;;
  init)   cmd_init ;;
  reset)  cmd_reset ;;
  psql)   cmd_psql "$@" ;;
  *)
    echo "Usage: bash scripts/db.sh {start|stop|status|init|reset|psql}" >&2
    exit 1
    ;;
esac
