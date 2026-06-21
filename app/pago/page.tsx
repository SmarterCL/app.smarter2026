"use client"

import { Suspense, useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, CheckCircle } from "lucide-react"
import { PLANS, type PlanId } from "@/lib/plans"
import { useWorkspaceBootstrap } from "@/lib/workspace-bootstrap-client"

export default function PagoPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <PagoPage />
    </Suspense>
  )
}

function PagoPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { tenant, isLoading: tenantLoading } = useWorkspaceBootstrap()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [paymentUrl, setPaymentUrl] = useState("")
  const [couponCode, setCouponCode] = useState(searchParams.get("coupon") || "")

  const planId = (searchParams.get("plan") || "starter") as PlanId
  const tenantId = searchParams.get("tenant") || tenant?.tenant_id
  const plan = PLANS[planId] || PLANS.starter

  useEffect(() => {
    if (!tenantLoading && !tenant) {
      router.push("/dashboard/tenant/new")
    }
  }, [tenant, tenantLoading, router])

  const handlePago = async () => {
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/flow/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_id: tenantId,
          plan: planId,
          email: tenant?.contact_email || "",
          coupon_code: couponCode || undefined,
          concepto: `Activación Plan ${plan.name} - SmarterBot QR`,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al crear orden de pago")
      }

      // Redirigir a Flow
      setPaymentUrl(data.url)
      window.location.href = data.url

    } catch (err) {
      console.error("Payment error:", err)
      setError(err instanceof Error ? err.message : "Error al procesar el pago")
    } finally {
      setIsLoading(false)
    }
  }

  if (!tenantId) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/pricing" className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              ← Volver
            </Badge>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">
            Activa tu plan
          </h1>
          <p className="text-muted-foreground">
            Completa el pago para comenzar a usar SmarterBot QR
          </p>
        </div>

        {/* Plan Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Plan {plan.name}</CardTitle>
            <CardDescription>{plan.tagline}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">
                ${plan.price.setup.toLocaleString("es-CL")}
              </span>
              <span className="text-sm text-muted-foreground">setup + </span>
              <span className="text-xl font-bold text-foreground">
                ${plan.price.monthly.toLocaleString("es-CL")}
              </span>
              <span className="text-sm text-muted-foreground">/mes</span>
            </div>

            <div className="rounded-lg bg-muted p-3">
              <p className="mb-2 text-sm font-medium text-foreground">Incluye:</p>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  {plan.limits.flujos === -1 ? "Flujos ilimitados" : `${plan.limits.flujos} flujos`}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  {plan.limits.devices === -1 ? "Devices ilimitados" : `${plan.limits.devices} dispositivos`}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                  {plan.limits.scansMes === -1 ? "Scans ilimitados" : `${plan.limits.scansMes.toLocaleString("es-CL")} scans/mes`}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Métodos de pago</CardTitle>
            <CardDescription>Procesado de forma segura por Flow.cl</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm font-medium text-foreground">Total a pagar hoy:</p>
              <p className="text-2xl font-bold text-foreground">
                ${(plan.price.setup + plan.price.monthly).toLocaleString("es-CL")}
              </p>
              <p className="text-xs text-muted-foreground">
                (Setup + primera mensualidad)
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium">Email de facturación</label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  type="email"
                  value={tenant?.contact_email || ""}
                  onChange={() => undefined}
                  placeholder="facturacion@tuempresa.cl"
                  readOnly
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Cupón</label>
                <input
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder="FREESETUP"
                />
              </div>
            </div>

            <p className="text-xs text-muted-foreground">
              El cupón se aplica antes de enviar el total a Flow. Si cubre el setup, pagarás solo la mensualidad.
            </p>

              <Button
                onClick={handlePago}
                className="w-full"
                size="lg"
                disabled={isLoading || !!paymentUrl || !tenant?.contact_email}
              >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : paymentUrl ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Redirigiendo...
                </>
              ) : (
                "Pagar con Flow.cl"
              )}
            </Button>

            <div className="text-center text-xs text-muted-foreground">
              <p>Aceptamos tarjetas de débito y crédito</p>
              <p className="mt-1">
                <Link href="/terminos" className="underline-offset-4 hover:underline">
                  Términos
                </Link>{" "}
                ·{" "}
                <Link href="/privacidad" className="underline-offset-4 hover:underline">
                  Privacidad
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            ¿Problemas con el pago?{" "}
            <Link
              href="https://wa.me/56979540471"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              Contacta soporte
            </Link>
          </p>
        </div>
      </main>
    </div>
  )
}
