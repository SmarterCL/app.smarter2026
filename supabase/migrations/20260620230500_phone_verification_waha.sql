alter table public.tenants
  add column if not exists phone_verified_at timestamptz,
  add column if not exists email_verified_at timestamptz,
  add column if not exists verification_status text not null default 'pending';

create table if not exists public.phone_verifications (
  id uuid primary key default gen_random_uuid(),
  tenant_id text not null references public.tenants(tenant_id) on delete cascade,
  phone text not null,
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  verified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_phone_verifications_tenant_id
  on public.phone_verifications(tenant_id, created_at desc);

create index if not exists idx_phone_verifications_expires_at
  on public.phone_verifications(expires_at);
