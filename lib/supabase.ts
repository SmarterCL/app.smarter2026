import { createClient, type SupabaseClient } from "@supabase/supabase-js"

type SupabaseClientOptions = Parameters<typeof createClient>[2]

let cachedClient: SupabaseClient | null = null

const getEnv = () => {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

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
