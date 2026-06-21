import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type SupabaseClientOptions = Parameters<typeof createClient>[2]

let cachedClient: SupabaseClient | null = null

const getEnv = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anonKey) {
    throw new Error("Supabase environment variables are missing")
  }

  return { url, anonKey }
}

export function getSupabaseClient(options?: SupabaseClientOptions): SupabaseClient {
  if (cachedClient) {
    return cachedClient
  }

  const { url, anonKey } = getEnv()

  console.log('[SUPABASE] init — url:', url, 'key_len:', anonKey?.length, 'key_last10:', anonKey?.slice(-10))

  cachedClient = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      headers: {
        "x-application-name": "smarteros-hub",
      },
    },
    ...options,
  }) as SupabaseClient

  return cachedClient
}

// =========================================================
// Tenant Helpers (Phase 3 - Multi-tenant support)
// =========================================================

export type Tenant = {
  id: string
  tenant_id: string
  name: string
  rut: string
  business_name: string
  contact_email: string | null
  email: string | null
  auth_user_id: string | null
  user_id: string | null
  plan: string
  status: string
  created_via: string | null
  services_enabled: {
    crm: boolean
    bot: boolean
    erp: boolean
    workflows: boolean
    kpi: boolean
  }
  created_at: string
  active?: boolean
  updated_at?: string
  chatwoot_inbox_id?: number | null
  botpress_workspace_id?: string | null
  odoo_company_id?: number | null
  metabase_dashboard_id?: string | null
}

/**
 * List all tenants for a given Supabase Auth user
 */
export async function listTenantsForUser(authUserId: string) {
  const supabase = getSupabaseClient()
 if (!supabase) throw new Error('Supabase not initialized')

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: false })

  if (error) throw error
  return data as Tenant[]
}

/**
 * Get a single tenant by ID (with ownership check via RLS)
 */
export async function getTenantById(tenantId: string) {
  const supabase = getSupabaseClient()
 if (!supabase) throw new Error('Supabase not initialized')

  const { data, error } = await supabase
    .from("tenants")
    .select("*")
    .eq("id", tenantId)
    .single()

  if (error) throw error
  return data as Tenant
}

/**
 * Create a new tenant
 */
export async function createTenant(tenant: {
  tenant_id: string
  name: string
  rut: string
  business_name: string
  contact_email: string
  auth_user_id: string
  services_enabled?: Partial<Tenant["services_enabled"]>
}) {
  const supabase = getSupabaseClient()
 if (!supabase) throw new Error('Supabase not initialized')

  const { data, error } = await supabase
    .from("tenants")
    .insert({
      ...tenant,
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

/**
 * Update tenant services
 */
export async function updateTenantServices(
  tenantId: string,
  services: Partial<Tenant["services_enabled"]>
) {
  const supabase = getSupabaseClient()
 if (!supabase) throw new Error('Supabase not initialized')

  const { data, error } = await supabase
    .from("tenants")
    .update({ services_enabled: services })
    .eq("id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as Tenant
}

/**
 * Update tenant integration IDs (after bootstrap)
 */
export async function updateTenantIntegrations(
  tenantId: string,
  integrations: {
    chatwoot_inbox_id?: number
    botpress_workspace_id?: string
    odoo_company_id?: number
    metabase_dashboard_id?: string
  }
) {
  const supabase = getSupabaseClient()
 if (!supabase) throw new Error('Supabase not initialized')

  const { data, error } = await supabase
    .from("tenants")
    .update(integrations)
    .eq("id", tenantId)
    .select()
    .single()

  if (error) throw error
  return data as Tenant
}

// =========================================================
// Legacy helpers (business_settings - deprecated)
// =========================================================

export async function upsertBusinessSettings(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string,
  data: { business_name: string; webhook_url: string }
) {
  return supabase
    .from("business_settings")
    .upsert(
      { user_id: userId, business_name: data.business_name, webhook_url: data.webhook_url },
      { onConflict: "user_id" }
    )
    .select()
    .single()
}

export async function fetchBusinessSettings(
  supabase: ReturnType<typeof getSupabaseClient>,
  userId: string
) {
  return supabase.from("business_settings").select("business_name, webhook_url").eq("user_id", userId).single()
}

// =========================================================
// MCP Invocation Logging (optional persist)
// =========================================================

export async function logMcpInvocation(entry: {
  user_id: string
  tool: string
  args: any
  result: any
  duration_ms: number
}) {
  if (process.env.MCP_LOG_DB !== 'true') return
  const supabase = getSupabaseClient()
  const payload = {
    user_id: entry.user_id,
    tool: entry.tool,
    args: JSON.stringify(entry.args).slice(0, 4000),
    result: JSON.stringify(entry.result).slice(0, 4000),
    duration_ms: entry.duration_ms,
  }
  const { error } = await supabase.from('mcp_invocations').insert(payload)
  if (error) {
    // eslint-disable-next-line no-console
    console.warn('[MCP] log insert failed', error.message)
  }
}
