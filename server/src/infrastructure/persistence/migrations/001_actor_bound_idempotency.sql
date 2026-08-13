BEGIN IMMEDIATE;
CREATE TABLE IF NOT EXISTS idempotency_records_v2 (
  tenant_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  route TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  response_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (tenant_id, actor_id, route, idempotency_key)
);
-- Legacy rows are deliberately quarantined: without actor and tenant provenance they
-- cannot be replayed safely. Operators may archive the old table after retention.
CREATE TABLE IF NOT EXISTS idempotency_migration_state (
  migration TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL,
  note TEXT NOT NULL
);
INSERT OR IGNORE INTO idempotency_migration_state VALUES (
  '001_actor_bound_idempotency', CURRENT_TIMESTAMP,
  'Legacy unscoped keys quarantined; no rows copied into active storage'
);
COMMIT;
