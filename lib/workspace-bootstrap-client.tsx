"use client"

import { useEffect, useState } from "react"

export type WorkspaceBootstrapTenant = {
  id: string
  tenant_id: string
  name: string
  rut: string
  business_name: string
  contact_email: string | null
  auth_user_id: string | null
  plan: string
  services_enabled: {
    crm: boolean
    bot: boolean
    erp: boolean
    workflows: boolean
    kpi: boolean
  }
  status: string
  created_at: string
}

export type WorkspaceBootstrapResponse = {
  success: boolean
  tenant: WorkspaceBootstrapTenant | null
  error?: string
  waha?: {
    session_name: string
    status: string
  }
  chatwoot?: {
    inbox_id: number | null
    account_id: string
  }
  tenants_count?: number
}

export function useWorkspaceBootstrap() {
  const [tenant, setTenant] = useState<WorkspaceBootstrapTenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    const load = async () => {
      setIsLoading(true)

      try {
        const response = await fetch("/api/workspace/bootstrap")
        const data = (await response.json().catch(() => null)) as WorkspaceBootstrapResponse | null

        if (!mounted) return

        if (!response.ok || !data?.tenant) {
          setTenant(null)
          setError(data?.error || "No se pudo resolver el tenant")
          return
        }

        setTenant(data.tenant)
        setError(null)
      } catch (loadError) {
        if (!mounted) return
        setTenant(null)
        setError(loadError instanceof Error ? loadError.message : "Error cargando workspace")
      } finally {
        if (mounted) setIsLoading(false)
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return {
    tenant,
    isLoading,
    error,
  }
}
