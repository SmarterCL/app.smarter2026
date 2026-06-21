insert into tenants (
  tenant_id,
  rut,
  razon_social,
  email,
  nombre_completo,
  plan,
  status,
  api_key
) values (
  'smarteros-demo',
  '76.123.456-K',
  'SmarterOS Demo SpA',
  'demo@smarteros.local',
  'SmarterOS Demo',
  'growth',
  'active',
  'demo_local_api_key'
) on conflict (tenant_id) do nothing;
