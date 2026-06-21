"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle, Circle, QrCode, Settings, Rocket, Download, Loader2 } from "lucide-react"
import { PLANS, type PlanId } from "@/lib/plans"

interface TenantData {
  tenant_id: string
  plan: string
  status: string
  limits: {
    flujos: number
    devices: number
    scansMes: number
  }
}

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
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <OnboardingDashboard />
    </Suspense>
  )
}

function OnboardingDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [tenantData, setTenantData] = useState<TenantData | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [qrDataUrl, setQrDataUrl] = useState<string>("")
  const [isLoadingQr, setIsLoadingQr] = useState(false)

  useEffect(() => {
    const data = localStorage.getItem("tenant")
    if (!data) {
      // Si no hay tenant, verificar si viene de registro nuevo
      const isNewRegistration = searchParams.get("new")
      if (isNewRegistration) {
        // Esperar un momento por si el localStorage se está seteando
        setTimeout(() => {
          const retryData = localStorage.getItem("tenant")
          if (!retryData) {
            router.push("/registro")
          }
        }, 500)
      } else {
        router.push("/registro")
      }
      return
    }
    setTenantData(JSON.parse(data))
  }, [router, searchParams])

  useEffect(() => {
    const tenantId = tenantData?.tenant_id
    if (!tenantId) return

    const loadQRCode = async () => {
      setIsLoadingQr(true)
      try {
        const response = await fetch(`/api/qr/generate?tenant_id=${tenantId}&format=dataURL`)
        const data = await response.json()
        if (data.dataUrl) {
          setQrDataUrl(data.dataUrl)
        }
      } catch (error) {
        console.error("Error loading QR code:", error)
      } finally {
        setIsLoadingQr(false)
      }
    }

    loadQRCode()
  }, [tenantData?.tenant_id])

  if (!tenantData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Cargando tu cuenta...</p>
        </div>
      </div>
    )
  }

  const plan = PLANS[tenantData.plan as PlanId] || PLANS.starter
  const progress = (currentStep / onboardingSteps.length) * 100
  const qrUrl = `${QR_BASE_URL}/${tenantData.tenant_id}`

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-muted/30">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              qr.smarterbot.store
            </Badge>
            <Badge className="rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">
              {plan.name}
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
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-foreground">
            ¡Tu cuenta está lista!
          </h1>
          <p className="text-muted-foreground">
            Tu QR dinámico ha sido generado. Aquí están los detalles de tu cuenta.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* QR Code */}
          <Card>
            <CardHeader>
            <CardTitle>Tu QR dinámico</CardTitle>
              <CardDescription>
                Usa este QR para abrir el flujo del tenant en WhatsApp
              </CardDescription>
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
                      <a href={qrDataUrl} download={`qr-${tenantData.tenant_id}.png`}>
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

          {/* Account Info */}
          <div className="space-y-6">
            {/* Plan Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tu plan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-foreground">${plan.price.monthly.toLocaleString("es-CL")}</p>
                  <p className="text-sm text-muted-foreground">/mes + IVA</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Flujos</span>
                    <span className="font-medium">
                      {plan.limits.flujos === -1 ? "∞" : `0/${plan.limits.flujos}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Devices</span>
                    <span className="font-medium">
                      {plan.limits.devices === -1 ? "∞" : `0/${plan.limits.devices}`}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Scans/mes</span>
                    <span className="font-medium">
                      {plan.limits.scansMes === -1 ? "∞" : `0/${plan.limits.scansMes.toLocaleString("es-CL")}`}
                    </span>
                  </div>
                </div>
                {tenantData.status === 'pending' && (
                  <div className="rounded-lg border border-amber-200 bg-amber-500/10 p-3">
                    <p className="text-sm text-amber-700">
                      ⚠️ Plan pendiente de activación. Completa el pago para activar.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tenant reference */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Referencia del tenant</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Tenant ID</p>
                  <code className="block break-all rounded bg-muted px-2 py-1 text-xs font-mono">
                    {tenantData.tenant_id}
                  </code>
                </div>
              </CardContent>
            </Card>

            {/* Payment CTA */}
            {tenantData.status === 'pending' && (
              <Card className="border-primary bg-primary/5">
                <CardHeader>
                  <CardTitle className="text-lg text-primary">Activa tu plan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Tu cuenta está creada pero necesita activación.
                  </p>
                  <Button asChild className="w-full">
                    <Link href={`/pago?plan=${tenantData.plan}&tenant=${tenantData.tenant_id}`}>
                      Pagar ahora
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Support */}
            <Card className="border-dashed border-emerald-400/40 bg-emerald-500/10">
              <CardHeader>
                <CardTitle className="text-lg text-emerald-700">¿Necesitas ayuda?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="mb-4 text-sm text-emerald-600">
                  Nuestro equipo te guía paso a paso desde WhatsApp.
                </p>
                <Button asChild className="w-full bg-emerald-500 hover:bg-emerald-600">
                  <Link
                    href="https://wa.me/56979540471?text=Hola%20SmarterOS%2C%20necesito%20ayuda%20con%20mi%20activación."
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Contactar soporte
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
