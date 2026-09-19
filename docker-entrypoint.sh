#!/usr/bin/env sh
set -eu

# Wait for the database to accept connections (bounded by env, default ~60s).
# Useful when running without `depends_on: condition: service_healthy`.
if [ -n "${DATABASE_URL:-}" ]; then
  attempts="${DB_WAIT_ATTEMPTS:-30}"
  i=1
  until node -e '
    const { Client } = require("pg");
    const c = new Client({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 3000 });
    c.connect().then(() => c.end().then(() => process.exit(0))).catch(() => process.exit(1));
  ' 2>/dev/null; do
    if [ "$i" -ge "$attempts" ]; then
      echo "[entrypoint] Database not reachable after $attempts attempts. Aborting." >&2
      exit 1
    fi
    echo "[entrypoint] Waiting for database... ($i/$attempts)"
    i=$((i + 1))
    sleep 2
  done

  echo "[entrypoint] Applying database migrations..."
  prisma migrate deploy
fi

exec "$@"