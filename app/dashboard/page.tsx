"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useSupabaseUser } from "@/lib/supabase-auth-client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { QrCode, Plus, Settings, BarChart3, Users, Activity, Download, Share2 } from "lucide-react"
import { PLANS, type PlanId, canPerformAction } from "@/lib/plans"

const QR_BASE_URL = "https://qr.smarterbot.store"

// Datos mock del tenant (en producción vendrían de la API)
const mockTenant = {
  rut: "76.123.456-K",
  razonSocial: "Restaurante SpA",
  plan: "growth" as PlanId,
  usage: {
    flujos: 2,
    devices: 1,
    scansMes: 450,
  },
}

export default function DashboardPage() {
  const { user, isLoaded } = useSupabaseUser()
  const [activeTab, setActiveTab] = useState("overview")
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [qrLoading, setQrLoading] = useState(false)

  const plan = PLANS[mockTenant.plan]
  const tenant = mockTenant

  // Calcular porcentajes de uso
  const flujosUsage = plan.limits.flujos === -1 ? 0 : (tenant.usage.flujos / plan.limits.flujos) * 100
  const devicesUsage = plan.limits.devices === -1 ? 0 : (tenant.usage.devices / plan.limits.devices) * 100
  const scansUsage = plan.limits.scansMes === -1 ? 0 : (tenant.usage.scansMes / plan.limits.scansMes) * 100

  // QR dinámico URL
  const qrUrl = `${QR_BASE_URL}/${tenant.rut.replace(/\./g, "").replace(/-/g, "")}`

  useEffect(() => {
    let mounted = true
    const loadQr = async () => {
      setQrLoading(true)
      try {
        const res = await fetch(`/api/qr/generate?tenant_id=${encodeURIComponent(tenant.rut.replace(/\./g, "").replace(/-/g, ""))}&format=dataURL`)
        const data = await res.json().catch(() => null)
        if (mounted && data?.dataUrl) {
          setQrDataUrl(data.dataUrl)
        }
      } finally {
        if (mounted) setQrLoading(false)
      }
    }

    loadQr()
    return () => {
      mounted = false
    }
  }, [tenant.rut])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-lg px-3 py-1.5 text-sm font-semibold">
              qr.smarterbot.store
            </Badge>
            <Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/20">
              {plan.name}
            </Badge>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/dashboard/flujos">
              <Button variant="ghost" size="sm" className="gap-2">
                <Settings className="h-4 w-4" />
                Flujos
              </Button>
            </Link>
            <Link href="/dashboard/analytics">
              <Button variant="ghost" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            </Link>
            {isLoaded && user && (
              <div className="hidden items-center gap-2 sm:flex">
                <div className="text-right">
                  <p className="text-xs font-medium text-foreground">{user.fullName}</p>
                  <p className="text-[10px] text-muted-foreground">{tenant.rut}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="overview" className="gap-2">
                  <Activity className="h-4 w-4" />
                  Overview
                </TabsTrigger>
                <TabsTrigger value="qr" className="gap-2">
                  <QrCode className="h-4 w-4" />
                  Tu QR
                </TabsTrigger>
                <TabsTrigger value="flows" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Flujos
                </TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                {/* Quick Stats */}
                <div className="grid gap-4 sm:grid-cols-3">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Scans este mes</CardDescription>
                      <CardTitle className="text-2xl font-bold">
                        {tenant.usage.scansMes.toLocaleString("es-CL")}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Límite:{" "}
                        {plan.limits.scansMes === -1 ? "∞" : plan.limits.scansMes.toLocaleString("es-CL")}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Flujos activos</CardDescription>
                      <CardTitle className="text-2xl font-bold">{tenant.usage.flujos}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Límite: {plan.limits.flujos === -1 ? "∞" : plan.limits.flujos}
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardDescription className="text-xs">Dispositivos</CardDescription>
                      <CardTitle className="text-2xl font-bold">{tenant.usage.devices}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-xs text-muted-foreground">
                        Límite: {plan.limits.devices === -1 ? "∞" : plan.limits.devices}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Acciones rápidas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Button asChild variant="outline" className="justify-start gap-2">
                        <Link href="/dashboard/flujos/nuevo">
                          <Plus className="h-4 w-4" />
                          Nuevo flujo
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="justify-start gap-2">
                        <Link href="/dashboard/qr">
                          <Download className="h-4 w-4" />
                          Descargar QR
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="justify-start gap-2">
                        <Link href="/dashboard/devices">
                          <Share2 className="h-4 w-4" />
                          Compartir QR
                        </Link>
                      </Button>
                      <Button asChild variant="outline" className="justify-start gap-2">
                        <Link href="/dashboard/analytics">
                          <Users className="h-4 w-4" />
                          Ver analytics
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="qr" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Tu QR dinámico</CardTitle>
                    <CardDescription>
                      Escanea este código para acceder a tu flujo principal
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-center">
                      <div className="relative aspect-square w-full max-w-xs overflow-hidden rounded-xl border bg-white p-4">
                        {qrLoading ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <QrCode className="h-32 w-32 text-primary/40" />
                          </div>
                        ) : qrDataUrl ? (
                          <img
                            src={qrDataUrl}
                            alt="QR dinámico"
                            className="h-full w-full rounded-lg object-contain"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <QrCode className="h-32 w-32 text-primary/40" />
                          </div>
                        )}
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <Badge variant="secondary" className="text-xs">
                            {tenant.rut}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    {/* QR URL */}
                    <div className="rounded-lg bg-muted p-3">
                      <p className="mb-2 text-xs font-medium text-muted-foreground">URL del QR</p>
                      <code className="block break-all text-sm font-mono text-foreground">
                        {qrUrl}
                      </code>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PNG
                      </Button>
                      <Button variant="outline" className="flex-1" onClick={() => window.open(qrUrl, "_blank", "noopener,noreferrer")}>
                        <Share2 className="mr-2 h-4 w-4" />
                        Abrir QR
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="flows" className="space-y-4">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Tus flujos</CardTitle>
                        <CardDescription>Gestiona los flujos de tu negocio</CardDescription>
                      </div>
                      <Button asChild size="sm">
                        <Link href="/dashboard/flujos/nuevo">
                          <Plus className="mr-2 h-4 w-4" />
                          Nuevo
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {tenant.usage.flujos === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <QrCode className="mb-4 h-12 w-12 text-muted-foreground/40" />
                        <p className="mb-2 font-medium text-foreground">Sin flujos creados</p>
                        <p className="mb-4 text-sm text-muted-foreground">
                          Crea tu primer flujo para comenzar
                        </p>
                        <Button asChild>
                          <Link href="/dashboard/flujos/nuevo">Crear flujo</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {/* Flow items mock */}
                        <div className="flex items-center justify-between rounded-lg border p-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <QrCode className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium text-foreground">Menú Digital</p>
                              <p className="text-xs text-muted-foreground">Activo • 320 scans</p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Settings className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Plan Usage */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Uso del plan</CardTitle>
                <CardDescription>{plan.name} - {plan.tagline}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Flujos */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Flujos</span>
                    <span className="font-medium">
                      {tenant.usage.flujos} / {plan.limits.flujos === -1 ? "∞" : plan.limits.flujos}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(100, flujosUsage)}%` }}
                    />
                  </div>
                </div>

                {/* Devices */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Dispositivos</span>
                    <span className="font-medium">
                      {tenant.usage.devices} / {plan.limits.devices === -1 ? "∞" : plan.limits.devices}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-blue-500 transition-all"
                      style={{ width: `${Math.min(100, devicesUsage)}%` }}
                    />
                  </div>
                </div>

                {/* Scans */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Scans este mes</span>
                    <span className="font-medium">
                      {tenant.usage.scansMes.toLocaleString("es-CL")} /{" "}
                      {plan.limits.scansMes === -1 ? "∞" : plan.limits.scansMes.toLocaleString("es-CL")}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div
                      className="h-2 rounded-full bg-emerald-500 transition-all"
                      style={{ width: `${Math.min(100, scansUsage)}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Upgrade CTA */}
            {mockTenant.plan !== "pro" && (
              <Card className="border-dashed border-primary/40 bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg">¿Necesitas más?</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Upgrade a {mockTenant.plan === "starter" ? "Growth" : "Pro"} para desbloquear
                    más features.
                  </p>
                  <Button asChild variant="outline" size="sm" className="w-full">
                    <Link href="/pricing">Ver planes</Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Soporte</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-3 text-sm text-muted-foreground">
                  ¿Problemas? Te ayudamos por WhatsApp.
                </p>
                <Button asChild variant="outline" size="sm" className="w-full">
                  <Link
                    href="https://wa.me/56979540471"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contactar
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
