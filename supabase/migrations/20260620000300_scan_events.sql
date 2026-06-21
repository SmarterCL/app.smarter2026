-- Scan events table for tracking QR scans
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS scan_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  flujo_id TEXT,
  device_id TEXT,
  
  -- Metadata del scan
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Timestamp
  scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Geolocation (opcional, se llena desde el cliente)
  country TEXT,
  region TEXT,
  city TEXT,
  
  -- Device info
  user_agent TEXT,
  ip_address INET,
  
  -- Foreign key
  CONSTRAINT fk_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(tenant_id)
    ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scan_events_tenant_id ON scan_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_flujo_id ON scan_events(flujo_id);
CREATE INDEX IF NOT EXISTS idx_scan_events_scanned_at ON scan_events(scanned_at);
CREATE INDEX IF NOT EXISTS idx_scan_events_tenant_scanned_at ON scan_events(tenant_id, scanned_at DESC);

-- RLS Policies
ALTER TABLE scan_events ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access" ON scan_events
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow tenants to read their own events
CREATE POLICY "Tenants can read own events" ON scan_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.tenant_id = scan_events.tenant_id
        AND t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

-- Allow anyone to insert (for scan endpoint)
CREATE POLICY "Anyone can insert scan events" ON scan_events
  FOR INSERT WITH CHECK (TRUE);

-- Function to get scan stats for a tenant
CREATE OR REPLACE FUNCTION get_tenant_scan_stats(
  p_tenant_id TEXT,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_scans BIGINT,
  unique_flujos BIGINT,
  unique_devices BIGINT,
  scans_by_day JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_scans,
    COUNT(DISTINCT flujo_id)::BIGINT as unique_flujos,
    COUNT(DISTINCT device_id)::BIGINT as unique_devices,
    jsonb_build_object(
      'days', p_days,
      'data', (
        SELECT jsonb_agg(row_to_json(daily))
        FROM (
          SELECT
            DATE(scanned_at) as date,
            COUNT(*) as count
          FROM scan_events
          WHERE tenant_id = p_tenant_id
            AND scanned_at >= NOW() - (p_days || ' days')::INTERVAL
          GROUP BY DATE(scanned_at)
          ORDER BY date
        ) daily
      )
    )::JSONB as scans_by_day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE scan_events IS 'Event log for QR scans across all tenants';
COMMENT ON COLUMN scan_events.metadata IS 'Additional scan data (campaign, source, etc.)';
COMMENT ON COLUMN scan_events.scanned_at IS 'When the scan occurred';
