-- Tenants table for SmarterBot QR SaaS
-- Run this in your Supabase SQL Editor

CREATE TYPE plan_type AS ENUM ('starter', 'growth', 'pro');
CREATE TYPE tenant_status AS ENUM ('pending', 'active', 'suspended', 'cancelled');

CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT UNIQUE NOT NULL,
  rut TEXT UNIQUE NOT NULL,
  razon_social TEXT NOT NULL,
  giro TEXT,
  email TEXT NOT NULL,
  telefono TEXT,
  nombre_completo TEXT NOT NULL,
  plan plan_type NOT NULL DEFAULT 'starter',
  status tenant_status NOT NULL DEFAULT 'pending',
  api_key TEXT UNIQUE NOT NULL,
  
  -- Limits (stored for quick access, synced with plan)
  flujos_limit INTEGER NOT NULL DEFAULT 1,
  devices_limit INTEGER NOT NULL DEFAULT 2,
  scans_mes_limit INTEGER NOT NULL DEFAULT 1000,
  
  -- Usage tracking
  flujos_count INTEGER NOT NULL DEFAULT 0,
  devices_count INTEGER NOT NULL DEFAULT 0,
  scans_mes_count INTEGER NOT NULL DEFAULT 0,
  scans_mes_reset_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  activated_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tenants_rut ON tenants(rut);
CREATE INDEX IF NOT EXISTS idx_tenants_tenant_id ON tenants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenants_api_key ON tenants(api_key);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_plan ON tenants(plan);

-- Function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to reset monthly scans
CREATE OR REPLACE FUNCTION reset_monthly_scans()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scans_mes_reset_at < NOW() - INTERVAL '1 month' THEN
    NEW.scans_mes_count := 0;
    NEW.scans_mes_reset_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for reset scans on read
DROP TRIGGER IF EXISTS check_reset_scans ON tenants;
CREATE TRIGGER check_reset_scans
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION reset_monthly_scans();

-- RLS Policies (Row Level Security)
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access" ON tenants
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow users to read their own tenant
CREATE POLICY "Users can read own tenant" ON tenants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

-- Function to increment scan count
CREATE OR REPLACE FUNCTION increment_scan(p_tenant_id TEXT)
RETURNS void AS $$
DECLARE
  v_scans_reset_at TIMESTAMP WITH TIME ZONE;
  v_scans_count INTEGER;
  v_limit INTEGER;
BEGIN
  -- Get current scan count and limit
  SELECT scans_mes_count, scans_mes_limit, scans_mes_reset_at
  INTO v_scans_count, v_limit, v_scans_reset_at
  FROM tenants
  WHERE tenant_id = p_tenant_id;
  
  -- Check if reset is needed
  IF v_scans_reset_at < NOW() - INTERVAL '1 month' THEN
    v_scans_count := 0;
  END IF;
  
  -- Check limit
  IF v_limit = -1 OR v_scans_count < v_limit THEN
    UPDATE tenants
    SET scans_mes_count = scans_mes_count + 1,
        scans_mes_reset_at = CASE 
          WHEN scans_mes_reset_at < NOW() - INTERVAL '1 month' THEN NOW()
          ELSE scans_mes_reset_at
        END
    WHERE tenant_id = p_tenant_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE tenants IS 'Tenants (RUT) for SmarterBot QR SaaS';
COMMENT ON COLUMN tenants.tenant_id IS 'Unique identifier for tenant (used in QR URLs)';
COMMENT ON COLUMN tenants.api_key IS 'API key for authentication';
COMMENT ON COLUMN tenants.plan IS 'Subscription plan (starter/growth/pro)';
COMMENT ON COLUMN tenants.status IS 'Account status (pending payment, active, suspended)';
COMMENT ON COLUMN tenants.scans_mes_reset_at IS 'When to reset monthly scan counter';
