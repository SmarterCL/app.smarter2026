"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, QrCode, Settings, Rocket, Circle, Download } from "lucide-react"
import { PLANS, type PlanId } from "@/lib/plans"
import { useWorkspaceBootstrap } from "@/lib/workspace-bootstrap-client"

const QR_BASE_URL = "https://qr.smarterbot.store"

const onboardingSteps = [
  {
    id: 1,
    title: "Configura tu primer flujo",
    description: "Crea el menú digital o formulario de contacto",
    icon: Settings,
  },
  {
    id: 2,
    title: "Personaliza tu QR",
    description: "Descarga tu código QR listo para imprimir",
    icon: QrCode,
  },
  {
    id: 3,
    title: "Activa dispositivos",
    description: "Conecta tablets, POS o Termux",
    icon: Circle,
  },
  {
    id: 4,
    title: "¡Listo para operar!",
    description: "Comienza a recibir clientes",
    icon: Rocket,
  },
]

export default function OnboardingDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <OnboardingDashboard />
    </Suspense>
  )
}

function OnboardingDashboard() {
  const router = useRouter()
  const { tenant, isLoading, error } = useWorkspaceBootstrap()
  const [currentStep, setCurrentStep] = useState(1)
  const [qrDataUrl, setQrDataUrl] = useState("")
  const [isLoadingQr, setIsLoadingQr] = useState(false)

  useEffect(() => {
    if (isLoading || !tenant?.tenant_id) return

    const loadQRCode = async () => {
      setIsLoadingQr(true)
      try {
        const response = await fetch(`/api/qr/generate?tenant_id=${tenant.tenant_id}&format=dataURL`)
        const data = await response.json().catch(() => null)
        if (data?.dataUrl) {
          setQrDataUrl(data.dataUrl)
        }
      } catch (loadError) {
        console.error("Error loading QR code:", loadError)
      } finally {
        setIsLoadingQr(false)
      }
    }

    loadQRCode()
  }, [isLoading, tenant?.tenant_id])

  useEffect(() => {
    if (!isLoading && !tenant) {
      router.push("/dashboard/tenant/new")
    }
  }, [isLoading, tenant, router])

  if (isLoading || !tenant) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando tu cuenta...</p>
        </div>
      </div>
    )
  }

  const plan = PLANS[tenant.plan as PlanId] || PLANS.starter
  const qrUrl = `${QR_BASE_URL}/${tenant.tenant_id}`
  const progress = (currentStep / onboardingSteps.length) * 100

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              qr.smarterbot.store
            </Badge>
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
              Onboarding
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ir al dashboard
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {error ? (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-500/10 p-4 text-sm text-amber-700">
            {error}
          </div>
        ) : null}

        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">Tu cuenta está lista</h1>
          <p className="text-muted-foreground">
            El tenant ya está resuelto desde servidor. Desde aquí puedes seguir al control plane o pagar.
          </p>
        </div>

        <div className="mb-8 rounded-lg border bg-card p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progreso</span>
            <span className="font-medium">{Math.round(progress)}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Tu QR dinámico</CardTitle>
              <CardDescription>Usa este QR para abrir el flujo del tenant en WhatsApp</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoadingQr ? (
                <div className="flex h-64 items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : qrDataUrl ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <img
                      src={qrDataUrl}
                      alt="Tu QR dinámico"
                      className="h-64 w-64 rounded-lg border bg-white p-2"
                    />
                  </div>
                  <div className="rounded-lg bg-muted p-3">
                    <p className="mb-1 text-xs font-medium text-muted-foreground">URL activa</p>
                    <code className="block break-all text-sm font-mono">{qrUrl}</code>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild className="flex-1">
                      <a href={qrDataUrl} download={`qr-${tenant.tenant_id}.png`}>
                        <Download className="mr-2 h-4 w-4" />
                        Descargar PNG
                      </a>
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => window.open(qrUrl, "_blank", "noopener,noreferrer")}
                    >
                      Abrir QR
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center text-center">
                  <div>
                    <QrCode className="mx-auto mb-2 h-12 w-12 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Error al cargar QR</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Control plane</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  El alta real ahora vive en servidor. Si necesitas crear otro tenant, entra al control plane.
                </p>
                <Button asChild className="w-full">
                  <Link href="/dashboard/tenant/new">Abrir control plane</Link>
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-2xl font-bold text-foreground">${plan.price.monthly.toLocaleString("es-CL")}</p>
                <p className="text-sm text-muted-foreground">/mes + IVA</p>
                <div className="rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                  Tenant ID:
                  <code className="mt-1 block break-all rounded bg-background px-2 py-1 text-xs text-foreground">
                    {tenant.tenant_id}
                  </code>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg text-primary">Activa tu plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Si todavía estás pendiente de pago, usa este paso para continuar con la activación.
                </p>
                <Button asChild className="w-full">
                  <Link href={`/pago?tenant=${tenant.tenant_id}&plan=starter`}>Pagar ahora</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
