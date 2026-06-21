alter table public.tenants
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null,
  add column if not exists name text,
  add column if not exists business_name text,
  add column if not exists contact_email text,
  add column if not exists active boolean not null default true,
  add column if not exists created_via text,
  add column if not exists services_enabled jsonb not null default '{"crm": false, "bot": false, "erp": false, "workflows": false, "kpi": false}'::jsonb,
  add column if not exists chatwoot_inbox_id integer,
  add column if not exists botpress_workspace_id text,
  add column if not exists odoo_company_id integer,
  add column if not exists metabase_dashboard_id text;

update public.tenants
set
  name = coalesce(name, razon_social),
  business_name = coalesce(business_name, razon_social),
  contact_email = coalesce(contact_email, email)
where name is null
   or business_name is null
   or contact_email is null;

create table if not exists public.tenant_members (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  unique (tenant_id, user_id)
);

create index if not exists idx_tenants_auth_user_id on public.tenants(auth_user_id);
create index if not exists idx_tenant_members_user_id on public.tenant_members(user_id);
create index if not exists idx_tenant_members_tenant_id on public.tenant_members(tenant_id);

alter table public.tenant_members enable row level security;

drop policy if exists "tenant_members_select_own" on public.tenant_members;
create policy "tenant_members_select_own"
  on public.tenant_members
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

drop policy if exists "tenant_members_insert_own" on public.tenant_members;
create policy "tenant_members_insert_own"
  on public.tenant_members
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

drop policy if exists "tenants_select_by_auth_user" on public.tenants;
create policy "tenants_select_by_auth_user"
  on public.tenants
  for select
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or exists (
      select 1
      from public.tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
    )
  );

drop policy if exists "tenants_insert_by_auth_user" on public.tenants;
create policy "tenants_insert_by_auth_user"
  on public.tenants
  for insert
  to authenticated
  with check (auth_user_id = (select auth.uid()));

drop policy if exists "tenants_update_by_auth_user" on public.tenants;
create policy "tenants_update_by_auth_user"
  on public.tenants
  for update
  to authenticated
  using (
    auth_user_id = (select auth.uid())
    or exists (
      select 1
      from public.tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  )
  with check (
    auth_user_id = (select auth.uid())
    or exists (
      select 1
      from public.tenant_members tm
      where tm.tenant_id = tenants.id
        and tm.user_id = (select auth.uid())
        and tm.role in ('owner', 'admin')
    )
  );
