import crypto from "crypto"
import { getSupabaseClient, type Tenant } from "@/lib/supabase"

export type { Tenant } from "@/lib/supabase"

export type TenantIntegrationPatch = {
  chatwoot_inbox_id?: number
  botpress_workspace_id?: string
  odoo_company_id?: number
  metabase_dashboard_id?: string
}

export async function listTenantsForUser(authUserId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Tenant[]
}

export async function getTenantById(tenantId: string) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single()

  if (error) throw error
  return data as Tenant
}

export async function createTenant(tenant: {
  tenant_id: string
  name: string
  rut: string
  business_name: string
  contact_email: string
  auth_user_id: string
  plan?: string
  status?: string
  api_key?: string
  services_enabled?: Partial<Tenant["services_enabled"]>
  razon_social?: string
  giro?: string | null
  telefono?: string | null
  nombre_completo?: string
  created_via?: string
}) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("tenants")
    .insert({
      tenant_id: tenant.tenant_id,
      name: tenant.name,
      rut: tenant.rut,
      razon_social: tenant.razon_social || tenant.business_name,
      giro: tenant.giro || null,
      email: tenant.contact_email,
      telefono: tenant.telefono || null,
      nombre_completo: tenant.nombre_completo || tenant.name,
      plan: tenant.plan || "starter",
      status: tenant.status || "pending",
      api_key: tenant.api_key || crypto.randomUUID().replace(/-/g, ""),
      business_name: tenant.business_name,
      contact_email: tenant.contact_email,
      auth_user_id: tenant.auth_user_id,
      created_via: tenant.created_via || "api",
      services_enabled: {
        crm: false,
        bot: false,
        erp: false,
        workflows: false,
        kpi: false,
        ...tenant.services_enabled,
      },
    })
    .select()
    .single()

  if (error) throw error
  return data as Tenant
}

export async function updateTenantServices(
  tenantId: string,
  services: Partial<Tenant["services_enabled"]>
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("tenants")
    .update({ services_enabled: services })
    .eq("id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as Tenant
}

export async function updateTenantIntegrations(
  tenantId: string,
  integrations: TenantIntegrationPatch
) {
  const supabase = getSupabaseClient()
  const { data, error } = await supabase
    .from("tenants")
    .update(integrations)
    .eq("id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as Tenant
}
