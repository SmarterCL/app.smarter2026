"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseUser } from "@/lib/supabase-auth-client"
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout"
import { useWorkspaceBootstrap } from "@/lib/workspace-bootstrap-client"

export default function WorkspacePage() {
  const { user, isLoaded } = useSupabaseUser()
  const { tenant, isLoading, error } = useWorkspaceBootstrap()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    }
  }, [isLoaded, user, router])

  if (!isLoaded || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Cargando workspace...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  if (!tenant) {
    router.push("/dashboard/tenant/new")
    return null
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center bg-background px-6">
        <div className="text-center">
          <p className="text-sm font-medium">No se pudo resolver el tenant</p>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return <WorkspaceLayout tenant={tenant} />
}
