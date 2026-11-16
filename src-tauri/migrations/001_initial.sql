CREATE TABLE IF NOT EXISTS tenants (
  code TEXT PRIMARY KEY NOT NULL,
  unit TEXT NOT NULL,
  name TEXT NOT NULL,
  area REAL NOT NULL DEFAULT 0,
  power INTEGER NOT NULL DEFAULT 0,
  phone TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL DEFAULT '',
  emergency TEXT NOT NULL DEFAULT '',
  parking TEXT NOT NULL DEFAULT '',
  tower TEXT NOT NULL DEFAULT '',
  occupancy_period TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'Review' CHECK (status IN ('Active', 'Review')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tenants_unit ON tenants(unit);
CREATE INDEX IF NOT EXISTS idx_tenants_tower ON tenants(tower);
CREATE INDEX IF NOT EXISTS idx_tenants_name ON tenants(name);
