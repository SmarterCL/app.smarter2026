-- MCP Invocations Log Table
-- Stores every MCP tool execution for audit, metrics, and debugging
CREATE TABLE IF NOT EXISTS mcp_invocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  tool TEXT NOT NULL,
  args TEXT,
  result TEXT,
  duration_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mcp_invocations_user_id ON mcp_invocations (user_id);
CREATE INDEX idx_mcp_invocations_tool ON mcp_invocations (tool);
CREATE INDEX idx_mcp_invocations_created_at ON mcp_invocations (created_at DESC);

-- External Health Checks Table
-- Stores periodic health checks of external services
CREATE TABLE IF NOT EXISTS external_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service TEXT NOT NULL,
  status TEXT NOT NULL,
  latency_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_external_health_service ON external_health (service);
CREATE INDEX idx_external_health_created_at ON external_health (created_at DESC);
CREATE INDEX idx_external_health_service_status ON external_health (service, status);

-- Example RLS policies (adjust based on your security model)
-- ALTER TABLE mcp_invocations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE external_health ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
-- CREATE POLICY "Service role full access mcp_invocations" ON mcp_invocations
-- FOR ALL USING (auth.role() = 'service_role');

-- CREATE POLICY "Service role full access external_health" ON external_health
-- FOR ALL USING (auth.role() = 'service_role');

COMMENT ON TABLE mcp_invocations IS 'Audit log for MCP tool invocations with timing and results';
COMMENT ON TABLE external_health IS 'Periodic health checks and status of external services (api.smarterbot.store, etc)';
