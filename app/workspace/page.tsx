"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSupabaseUser } from "@/lib/supabase-auth-client"
import { WorkspaceLayout } from "@/components/workspace/WorkspaceLayout"

export default function WorkspacePage() {
  const { user, isLoaded } = useSupabaseUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/login")
    }
  }, [isLoaded, user, router])

  if (!isLoaded) {
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

  return <WorkspaceLayout />
}
