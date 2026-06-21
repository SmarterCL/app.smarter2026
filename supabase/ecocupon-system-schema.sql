-- Ecocupon QR System - SmarterLAB
-- Sistema de incentivos para reciclaje
-- Run this in your Supabase SQL Editor

-- Tabla de ecocupones (QR de incentivos)
CREATE TABLE IF NOT EXISTS ecocupones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  codigo_qr TEXT UNIQUE NOT NULL,
  
  -- Estado del cupón
  estado TEXT NOT NULL DEFAULT 'pendiente', -- pendiente, validado, canjeado, expirado
  tipo TEXT NOT NULL, -- descuento, cashback, puntos
  
  -- Valor
  valor_puntos INTEGER NOT NULL DEFAULT 0,
  valor_pesos INTEGER NOT NULL DEFAULT 0,
  
  -- Origen
  origen TEXT NOT NULL, -- walmart_scan, camion_scan, manual
  producto_asociado TEXT,
  
  -- Validación
  validado_por TEXT, -- ID del validador (camionero)
  validado_en TIMESTAMP WITH TIME ZONE,
  
  -- Canje
  canjeado_en TIMESTAMP WITH TIME ZONE,
  comercio_canje TEXT,
  
  -- Timestamps
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expira_en TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Foreign key
  CONSTRAINT fk_tenant_ecocupon
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(tenant_id)
    ON DELETE CASCADE
);

-- Tabla de transacciones de reciclaje
CREATE TABLE IF NOT EXISTS reciclaje_transacciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id TEXT NOT NULL,
  ecocupon_id UUID REFERENCES ecocupones(id),
  
  -- Datos del reciclaje
  tipo_material TEXT NOT NULL, -- plastico, vidrio, carton, aluminio
  peso_gramos INTEGER NOT NULL,
  cantidad_items INTEGER NOT NULL DEFAULT 1,
  
  -- Ubicación
  comuna TEXT NOT NULL,
  latitud DECIMAL(9, 6),
  longitud DECIMAL(9, 6),
  
  -- Validación
  validado_por TEXT, -- ID del validador
  metodo_validacion TEXT, -- qr_scan, peso_real, foto
  
  -- Walmart integration
  walmart_producto_id TEXT,
  walmart_compra_id TEXT,
  coincidencia_compra BOOLEAN DEFAULT FALSE,
  
  -- Cortical Labs prediction
  cortical_prediction_id TEXT,
  prediction_accuracy DECIMAL(5, 4),
  
  -- Timestamps
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Foreign key
  CONSTRAINT fk_tenant_reciclaje
    FOREIGN KEY (tenant_id)
    REFERENCES tenants(tenant_id)
    ON DELETE CASCADE
);

-- Tabla de rutas de camión
CREATE TABLE IF NOT EXISTS rutas_camion (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  camion_id TEXT NOT NULL,
  conductor_id TEXT NOT NULL,
  
  -- Estado de la ruta
  estado TEXT NOT NULL DEFAULT 'planificada', -- planificada, en_curso, completada
  
  -- Ruta optimizada (Cortical Labs)
  waypoints JSONB NOT NULL DEFAULT '[]'::jsonb,
  distancia_total_km DECIMAL(10, 2),
  tiempo_estimado_min INTEGER,
  
  -- Predicciones
  cortical_prediction_id TEXT,
  fill_percentage_predicho DECIMAL(5, 2),
  fill_percentage_real DECIMAL(5, 2),
  
  -- Recolección
  total_reciclado_kg DECIMAL(10, 2) DEFAULT 0,
  total_ecocupones INTEGER DEFAULT 0,
  
  -- Timestamps
  fecha_programada DATE NOT NULL,
  inicio_en TIMESTAMP WITH TIME ZONE,
  fin_en TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Tabla de learning de Cortical Labs
CREATE TABLE IF NOT EXISTS cortical_learning (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT NOT NULL,
  route_id UUID REFERENCES rutas_camion(id),
  
  -- Datos de entrenamiento
  input_patterns JSONB NOT NULL,
  output_prediction JSONB NOT NULL,
  actual_result JSONB,
  
  -- Accuracy
  accuracy DECIMAL(5, 4),
  error_margin DECIMAL(10, 2),
  
  -- Biological metrics
  biological_neurons_used INTEGER,
  training_epochs INTEGER,
  
  -- Timestamps
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes para performance
CREATE INDEX IF NOT EXISTS idx_ecocupones_tenant_id ON ecocupones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ecocupones_codigo_qr ON ecocupones(codigo_qr);
CREATE INDEX IF NOT EXISTS idx_ecocupones_estado ON ecocupones(estado);
CREATE INDEX IF NOT EXISTS idx_ecocupones_creado_en ON ecocupones(creado_en);

CREATE INDEX IF NOT EXISTS idx_reciclaje_transacciones_tenant_id ON reciclaje_transacciones(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reciclaje_transacciones_creado_en ON reciclaje_transacciones(creado_en);
CREATE INDEX IF NOT EXISTS idx_reciclaje_transacciones_material ON reciclaje_transacciones(tipo_material);
CREATE INDEX IF NOT EXISTS idx_reciclaje_transacciones_walmart ON reciclaje_transacciones(walmart_producto_id);

CREATE INDEX IF NOT EXISTS idx_rutas_camion_estado ON rutas_camion(estado);
CREATE INDEX IF NOT EXISTS idx_rutas_camion_fecha ON rutas_camion(fecha_programada);
CREATE INDEX IF NOT EXISTS idx_rutas_camion_camion_id ON rutas_camion(camion_id);

CREATE INDEX IF NOT EXISTS idx_cortical_learning_model_id ON cortical_learning(model_id);
CREATE INDEX IF NOT EXISTS idx_cortical_learning_route_id ON cortical_learning(route_id);

-- RLS Policies
ALTER TABLE ecocupones ENABLE ROW LEVEL SECURITY;
ALTER TABLE reciclaje_transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE rutas_camion ENABLE ROW LEVEL SECURITY;
ALTER TABLE cortical_learning ENABLE ROW LEVEL SECURITY;

-- Policies ecocupones
CREATE POLICY "Usuarios pueden leer sus ecocupones" ON ecocupones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.tenant_id = ecocupones.tenant_id
        AND t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

CREATE POLICY "Usuarios pueden crear ecocupones" ON ecocupones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.tenant_id = ecocupones.tenant_id
        AND t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

-- Policies reciclaje_transacciones
CREATE POLICY "Usuarios pueden leer sus transacciones" ON reciclaje_transacciones
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.tenant_id = reciclaje_transacciones.tenant_id
        AND t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

CREATE POLICY "Usuarios pueden crear transacciones" ON reciclaje_transacciones
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM tenants t
      WHERE t.tenant_id = reciclaje_transacciones.tenant_id
        AND t.api_key = current_setting('app.current_api_key', TRUE)
    )
  );

-- Policies rutas_camion (solo lectura para validadores)
CREATE POLICY "Validadores pueden leer rutas" ON rutas_camion
  FOR SELECT USING (TRUE);

-- Policies cortical_learning (solo servicio)
CREATE POLICY "Service role tiene acceso completo" ON cortical_learning
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Función para generar código QR de ecocupon
CREATE OR REPLACE FUNCTION generar_ecocupon(
  p_tenant_id TEXT,
  p_tipo TEXT,
  p_valor_puntos INTEGER
)
RETURNS TEXT AS $$
DECLARE
  v_codigo TEXT;
  v_ecocupon_id UUID;
BEGIN
  -- Generar código único
  v_codigo := 'ECO' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);
  
  -- Insertar ecocupon
  INSERT INTO ecocupones (tenant_id, codigo_qr, tipo, valor_puntos, expira_en)
  VALUES (p_tenant_id, v_codigo, p_tipo, p_valor_puntos, NOW() + INTERVAL '30 days')
  RETURNING id INTO v_ecocupon_id;
  
  RETURN v_codigo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para validar ecocupon desde camión
CREATE OR REPLACE FUNCTION validar_ecocupon(
  p_codigo_qr TEXT,
  p_validador_id TEXT,
  p_material TEXT,
  p_peso_gramos INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_ecocupon RECORD;
  v_transaccion_id UUID;
  v_puntos_adicionales INTEGER := 0;
BEGIN
  -- Buscar ecocupon
  SELECT * INTO v_ecocupon
  FROM ecocupones
  WHERE codigo_qr = p_codigo_qr
    AND estado = 'pendiente'
    AND expira_en > NOW();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Ecocupón inválido o expirado');
  END IF;
  
  -- Calcular puntos adicionales por peso
  IF p_peso_gramos > 1000 THEN
    v_puntos_adicionales := (p_peso_gramos / 1000) * 10; -- 10 puntos por kg
  END IF;
  
  -- Actualizar ecocupon
  UPDATE ecocupones
  SET estado = 'validado',
      validado_por = p_validador_id,
      validado_en = NOW(),
      valor_puntos = valor_puntos + v_puntos_adicionales
  WHERE id = v_ecocupon.id;
  
  -- Crear transacción de reciclaje
  INSERT INTO reciclaje_transacciones (
    tenant_id, ecocupon_id, tipo_material, peso_gramos,
    validado_por, metodo_validacion
  ) VALUES (
    v_ecocupon.tenant_id, v_ecocupon.id, p_material, p_peso_gramos,
    p_validador_id, 'qr_scan'
  ) RETURNING id INTO v_transaccion_id;
  
  -- Verificar coincidencia con compra Walmart
  -- TODO: Integrar con Walmart API
  
  RETURN jsonb_build_object(
    'success', true,
    'ecocupon_id', v_ecocupon.id,
    'transaccion_id', v_transaccion_id,
    'puntos_totales', v_ecocupon.valor_puntos + v_puntos_adicionales,
    'mensaje', '¡Ecocupón validado! Ganaste ' || (v_ecocupon.valor_puntos + v_puntos_adicionales) || ' puntos'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función para obtener estadísticas de reciclaje por tenant
CREATE OR REPLACE FUNCTION obtener_estadisticas_reciclaje(
  p_tenant_id TEXT,
  p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_transacciones BIGINT,
  total_puntos_ganados BIGINT,
  total_kg_reciclados DECIMAL,
  material_mas_comun TEXT,
  racha_dias INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COALESCE(SUM(e.valor_puntos), 0)::BIGINT,
    COALESCE(SUM(r.peso_gramos), 0) / 1000.0::DECIMAL,
    MODE() WITHIN GROUP (ORDER BY r.tipo_material)::TEXT,
    0 -- TODO: Calcular racha
  FROM reciclaje_transacciones r
  JOIN ecocupones e ON r.ecocupon_id = e.id
  WHERE r.tenant_id = p_tenant_id
    AND r.creado_en >= NOW() - (p_dias || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE ecocupones IS 'Sistema de incentivos QR para reciclaje';
COMMENT ON TABLE reciclaje_transacciones IS 'Historial de transacciones de reciclaje con validación Walmart + Cortical';
COMMENT ON TABLE rutas_camion IS 'Rutas optimizadas con Cortical Labs para recolección';
COMMENT ON TABLE cortical_learning IS 'Datos de entrenamiento para modelo biológico de Cortical Labs';
