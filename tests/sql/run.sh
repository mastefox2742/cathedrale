#!/usr/bin/env bash
# Rejoue le schéma, les migrations et les tests de sécurité sur une base
# PostgreSQL LOCALE de test (jamais la production).
# Usage : PGPORT=55432 PGUSER=postgres tests/sql/run.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
PSQL="${PSQL:-psql}"
DB="${DB:-cathedrale_test}"
"$PSQL" -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
"$PSQL" -q -d "$DB" -v ON_ERROR_STOP=1 -f tests/sql/00_supabase_stub.sql
"$PSQL" -q -d "$DB" -v ON_ERROR_STOP=1 -f mobile/supabase/schema.sql
for f in mobile/supabase/migrations/*.sql; do
  echo "→ $f"
  "$PSQL" -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f"
done
for f in tests/sql/1*.sql; do
  echo "→ $f"
  "$PSQL" -q -d "$DB" -v ON_ERROR_STOP=1 -f "$f" 2>&1 | grep -E "OK|ÉCHEC|ERROR|ERREUR|──"
done
