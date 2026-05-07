-- Reference only: SQLite-shaped DDL mirroring `20260509090000_maintenance_tickets_enterprise.sql`.
-- DamianixPro production uses PostgreSQL (Supabase). Do not run this against Supabase.

-- PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS maintenance_tickets (
  id TEXT PRIMARY KEY,
  ticket_number TEXT NOT NULL UNIQUE,
  tenant_id TEXT NOT NULL,
  property_id TEXT NOT NULL,
  unit_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'cancelled')),
  assigned_to TEXT,
  created_by TEXT NOT NULL,
  cost_estimate REAL NOT NULL DEFAULT 0,
  actual_cost REAL,
  sla_deadline TEXT NOT NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants (id),
  FOREIGN KEY (property_id) REFERENCES properties (id)
);

CREATE TABLE IF NOT EXISTS maintenance_comments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES maintenance_tickets (id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_attachments (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES maintenance_tickets (id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS maintenance_history (
  id TEXT PRIMARY KEY,
  ticket_id TEXT NOT NULL REFERENCES maintenance_tickets (id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by TEXT,
  metadata TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_property ON maintenance_tickets (property_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_status ON maintenance_tickets (status);
CREATE INDEX IF NOT EXISTS idx_maintenance_tickets_sla ON maintenance_tickets (sla_deadline);
