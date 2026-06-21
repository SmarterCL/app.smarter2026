"use client"

import Link from "next/link"
import { useSupabaseUser } from "@/lib/supabase-auth-client"
import { useWorkspaceBootstrap } from "@/lib/workspace-bootstrap-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Shield, ArrowRight, Settings, LayoutDashboard, FileText } from "lucide-react"
import { PLANS } from "@/lib/plans"

export default function DashboardPage() {
  const { user, isLoaded } = useSupabaseUser()
  const { tenant, isLoading } = useWorkspaceBootstrap()

  if (!isLoaded || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const plan = tenant ? PLANS[tenant.plan as keyof typeof PLANS] || PLANS.starter : null

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              app.smarterbot.store
            </Badge>
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
              Control plane
            </Badge>
          </div>
          {user ? (
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user.fullName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          ) : null}
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">Control plane</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            La operación vive fuera de esta vista. Aquí queda solo la administración del SaaS, el estado de cuenta y los accesos.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Estado de la cuenta</CardTitle>
              <CardDescription>Fuente única de verdad desde servidor.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Tenant</p>
                <p className="mt-1 break-all text-sm font-medium">{tenant?.business_name || "Sin tenant"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Plan</p>
                <p className="mt-1 text-sm font-medium">{plan?.name || "starter"}</p>
              </div>
              <div className="rounded-lg border bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="mt-1 text-sm font-medium">{tenant?.status || "pendiente"}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Acciones</CardTitle>
              <CardDescription>Solo navegación de control plane.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full justify-between">
                <Link href="/dashboard/onboarding">
                  Continuar onboarding
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/workspace">
                  Abrir workspace
                  <LayoutDashboard className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-between">
                <Link href="/dashboard/tenant/new">
                  Nuevo tenant
                  <Settings className="h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Documentación</CardTitle>
              <CardDescription>Apuntes de uso del SaaS, no del runtime.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild variant="ghost" className="w-full justify-start gap-2 px-0">
                <Link href="/pricing">
                  <FileText className="h-4 w-4" />
                  Revisar planes
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Runtime invisible
              </CardTitle>
              <CardDescription>
                El detalle operativo queda fuera de esta vista y se consulta solo en workspace o APIs internas.
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  )
}
