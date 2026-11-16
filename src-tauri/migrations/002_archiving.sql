ALTER TABLE tenants ADD COLUMN archived INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_tenants_archived ON tenants(archived);
