-- Payment orders table for Flow.cl integration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  orden_compra TEXT UNIQUE NOT NULL,
  flow_token TEXT UNIQUE NOT NULL,
  
  -- Payment details
  plan TEXT NOT NULL,
  monto INTEGER NOT NULL, -- en CLP
  email TEXT NOT NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending', -- pending, paid, failed, refunded
  payment_method TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  paid_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  flow_response JSONB,
  
  -- Foreign key
  CONSTRAINT fk_tenant
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(tenant_id)
    ON DELETE CASCADE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payment_orders_tenant_id ON payment_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_flow_token ON payment_orders(flow_token);
CREATE INDEX IF NOT EXISTS idx_payment_orders_orden_compra ON payment_orders(orden_compra);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);
CREATE INDEX IF NOT EXISTS idx_payment_orders_created_at ON payment_orders(created_at);

-- RLS Policies
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access" ON payment_orders
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Allow tenants to read their own orders
CREATE POLICY "Tenants can read own orders" ON payment_orders
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.tenant_id = payment_orders.tenant_id
        AND t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

-- Comments
COMMENT ON TABLE payment_orders IS 'Payment orders for Flow.cl integration';
COMMENT ON COLUMN payment_orders.orden_compra IS 'Unique order ID for Flow';
COMMENT ON COLUMN payment_orders.flow_token IS 'Token returned by Flow API';
COMMENT ON COLUMN payment_orders.status IS 'Payment status (pending/paid/failed/refunded)';
COMMENT ON COLUMN payment_orders.flow_response IS 'Full response from Flow webhook';
