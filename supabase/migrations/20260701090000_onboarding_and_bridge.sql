-- Migración: supabase/migrations/20260701090000_onboarding_and_bridge.sql

-- 1. Crear tabla de cupones para la pasarela Flow
CREATE TABLE IF NOT EXISTS public.coupon (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC NOT NULL CHECK (discount_value >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para coupon
ALTER TABLE public.coupon ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS para la tabla coupon
DROP POLICY IF EXISTS "Service role has full access on coupon" ON public.coupon;
CREATE POLICY "Service role has full access on coupon" ON public.coupon
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Allow public read access to active coupons" ON public.coupon;
CREATE POLICY "Allow public read access to active coupons" ON public.coupon
  FOR SELECT USING (is_active = true);

-- 2. Insertar cupón por defecto para pruebas
INSERT INTO public.coupon (code, discount_type, discount_value, is_active, created_at)
VALUES ('WELCOME2026', 'percent', 10, true, NOW())
ON CONFLICT (code) DO NOTHING;

-- 3. Crear tabla de mapeo de conversaciones para el bridge de chat
CREATE TABLE IF NOT EXISTS public.conversation_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  chatwoot_conversation_id INTEGER UNIQUE NOT NULL,
  whatsapp_phone TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tenant_id, whatsapp_phone)
);

-- Habilitar RLS para conversation_mapping
ALTER TABLE public.conversation_mapping ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para conversation_mapping
DROP POLICY IF EXISTS "Service role has full access on conversation_mapping" ON public.conversation_mapping;
CREATE POLICY "Service role has full access on conversation_mapping" ON public.conversation_mapping
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

DROP POLICY IF EXISTS "Users can read own mappings" ON public.conversation_mapping;
CREATE POLICY "Users can read own mappings" ON public.conversation_mapping
  FOR SELECT USING (
    tenant_id IN (
      SELECT id FROM public.tenants
      WHERE auth_user_id = (SELECT auth.uid())
         OR EXISTS (
           SELECT 1 FROM public.tenant_members tm
           WHERE tm.tenant_id = tenants.id
             AND tm.user_id = (SELECT auth.uid())
         )
    )
  );

-- 4. Agregar columnas de tracking de onboarding a la tabla tenants
ALTER TABLE public.tenants
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS onboarding_error JSONB DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS waha_session_status TEXT DEFAULT 'STOPPED',
  ADD COLUMN IF NOT EXISTS chatwoot_inbox_id BIGINT,
  ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMP WITH TIME ZONE;
