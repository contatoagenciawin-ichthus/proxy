#!/usr/bin/env bash
# G2: real, concurrent PostgreSQL TCP connections in disposable CI ONLY.
# Never use against Neon staging/production or a shared database.
set -euo pipefail
: "${PGHOST:?PGHOST required}"
: "${PGDATABASE:?PGDATABASE required}"
if [[ "$PGDATABASE" != "proxy_g2_ephemeral" || "$PGHOST" != "127.0.0.1" ]]; then
  echo "Refusing non-disposable database" >&2
  exit 1
fi
ADMIN_PASSWORD="${PGPASSWORD:?disposable admin password required}"
ROLE="proxy_meta_ichthus_replay_login"
TEST_PASSWORD="github_disposable_replay_only"
export PGUSER=postgres PGPASSWORD="$ADMIN_PASSWORD"
psql -X -v ON_ERROR_STOP=1 -q <<'SQL'
create role proxy_meta_ichthus_replay_login
 login password 'github_disposable_replay_only'
 nobypassrls nosuperuser nocreatedb nocreaterole noreplication;
grant proxy_meta_ichthus_replay_writer to proxy_meta_ichthus_replay_login;
SQL

export PGUSER="$ROLE" PGPASSWORD="$TEST_PASSWORD"
workdir="$(mktemp -d)"
trap 'rm -rf "$workdir"' EXIT

# Each psql command has a SEPARATE connection and an explicit committed INSERT.
# Collect only the returned permit IDs; no codes, tokens, session IDs or secrets.
run_wave() {
  local kind="$1" count="$2" permit nonce sql
  local -a pids=()
  for (( i=1; i<=count; i++ )); do
    if [[ "$kind" == "same-permit" ]]; then
      permit="$(printf 'p%.0s' {1..40})"
      nonce="$(printf '1%.0s' {1..64})"
    else
      permit="$(printf 'q%.0s' {1..39})$((i%10))"
      # Different permit IDs, one nonce. i ranges 1..9 in this wave.
      nonce="$(printf '2%.0s' {1..64})"
    fi
    sql="insert into proxy_meta.ichthus_exchange_permit_uses
      (organization_id,permit_id,nonce_digest,expires_at,consumed_at)
      values ('1715a7b9-5209-4e7c-8439-84658061904f',
              '$permit','$nonce',now()+interval '60 seconds',now())
      on conflict do nothing returning permit_id;"
    (psql -X -v ON_ERROR_STOP=1 -At -c "$sql" >"$workdir/$kind-$i.out") &
    pids+=("$!")
  done
  for pid in "${pids[@]}"; do wait "$pid"; done
  local winners
  winners="$(cat "$workdir"/"$kind"-*.out | grep -c '[A-Za-z0-9]' || true)"
  if [[ "$winners" -ne 1 ]]; then
    echo "$kind concurrency failure: expected one successful INSERT, got $winners" >&2
    exit 1
  fi
}
run_wave same-permit 12
run_wave same-nonce 9

# Assert committed rows are globally visible to a fresh connection.
export PGUSER=postgres PGPASSWORD="$ADMIN_PASSWORD"
actual="$(psql -X -v ON_ERROR_STOP=1 -At -c "
select count(*) from proxy_meta.ichthus_exchange_permit_uses
where permit_id = repeat('p',40) or nonce_digest = repeat('2',64)")"
if [[ "$actual" != "2" ]]; then
  echo "Committed replay ledger count mismatch: $actual" >&2
  exit 1
fi
echo "G2 live TCP concurrency passed: one commit per permit and OAuth nonce"
