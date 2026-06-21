"use client"

import Link from "next/link"
import { Check } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

const QR_BASE_URL = "https://qr.smarterbot.store"

const plans = [
  {
    id: "starter",
    name: "Starter",
    tagline: "QR inteligente",
    target: "Pymes / Restaurantes chicos",
    price: {
      setup: 30000,
      monthly: 25000,
    },
    features: [
      "QR dinámico (qr.smarterbot.store)",
      "1 flujo (menú o contacto)",
      "1 tenant (RUT)",
      "Hasta 2 dispositivos",
      "Integración básica con Odoo",
      "Chatbot simple (Telegram)",
    ],
    limits: {
      flujos: 1,
      devices: 2,
      scansMes: 1000,
    },
    color: "emerald",
    cta: "Comenzar gratis",
    popular: false,
  },
  {
    id: "growth",
    name: "Growth",
    tagline: "Automatización comercial",
    target: "Negocios en operación",
    price: {
      setup: 80000,
      monthly: 59000,
    },
    features: [
      "Todo Starter +",
      "Múltiples flujos (menú + soporte + pago)",
      "Integración completa Odoo + Chatwoot",
      "Hasta 5 dispositivos",
      "Historial cliente (Redis)",
      "Reglas automatizadas del SaaS",
    ],
    limits: {
      flujos: 5,
      devices: 5,
      scansMes: 10000,
    },
    color: "blue",
    cta: "Comenzar gratis",
    popular: true,
  },
  {
    id: "pro",
    name: "Pro",
    tagline: "SmarterOS completo",
    target: "Cadenas / Retail / Turismo",
    price: {
      setup: 200000,
      monthly: 180000,
    },
    features: [
      "Todo Growth +",
      "Multi-sucursal",
      "NFC + QR + WiFi login",
      "Cluster distribuido (OpenClaw)",
      "IA personalizada (Ollama + RAG)",
      "Dashboard operativo",
      "SLA + soporte prioritario",
    ],
    limits: {
      flujos: -1, // ilimitado
      devices: -1,
      scansMes: -1,
    },
    color: "red",
    cta: "Comenzar gratis",
    popular: false,
  },
]

function formatCLP(value: number) {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    minimumFractionDigits: 0,
  }).format(value)
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              qr.smarterbot.store
            </Badge>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Button asChild size="sm">
              <Link href="/registro">Crear cuenta</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-12 text-center">
          <Badge className="mb-4 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            Planes SaaS
          </Badge>
          <h1 className="mb-4 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            Elige el plan perfecto para tu negocio
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
            Desde QR inteligente hasta automatización completa con IA. Sin contratos forzosos.
          </p>
        </div>

        {/* Value Props */}
        <div className="mb-12 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-dashed border-emerald-400/40 bg-emerald-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-emerald-600">QR que vende solo</p>
          </div>
          <div className="rounded-xl border border-dashed border-blue-400/40 bg-blue-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-blue-600">Mesa sin garzón</p>
          </div>
          <div className="rounded-xl border border-dashed border-purple-400/40 bg-purple-500/10 p-4 text-center">
            <p className="text-sm font-semibold text-purple-600">Captura clientes con WiFi</p>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative flex flex-col ${
                plan.popular
                  ? "border-primary shadow-lg shadow-primary/10"
                  : "border-border shadow-sm"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">Más popular</Badge>
                </div>
              )}

              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription className="text-base">{plan.tagline}</CardDescription>
                <p className="text-xs text-muted-foreground">{plan.target}</p>
              </CardHeader>

              <CardContent className="flex-1 space-y-6">
                {/* Price */}
                <div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-foreground">{formatCLP(plan.price.monthly)}</span>
                    <span className="text-sm text-muted-foreground">/mes + IVA</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Setup: {formatCLP(plan.price.setup)}</p>
                </div>

                {/* Limits */}
                <div className="rounded-lg bg-muted/50 p-3">
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {plan.limits.flujos === -1 ? "∞" : plan.limits.flujos}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Flujos</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {plan.limits.devices === -1 ? "∞" : plan.limits.devices}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Devices</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-foreground">
                        {plan.limits.scansMes === -1 ? "∞" : plan.limits.scansMes >= 1000 ? `${plan.limits.scansMes / 1000}k` : plan.limits.scansMes}
                      </p>
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Scans/mes</p>
                    </div>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-3">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                      <span className="text-muted-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  asChild
                  className="w-full"
                  size="lg"
                  variant={plan.popular ? "default" : "outline"}
                >
                  <Link href={`/registro?plan=${plan.id}`}>{plan.cta}</Link>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ CTA */}
        <div className="mt-16 rounded-2xl border border-dashed border-border bg-muted/30 p-8 text-center">
          <h2 className="mb-2 text-xl font-semibold text-foreground">¿Necesitas un plan personalizado?</h2>
          <p className="mb-4 text-muted-foreground">
            Habla con nuestro equipo para empresas con necesidades especiales.
          </p>
          <Button asChild variant="outline">
            <Link
              href="https://wa.me/56979540471?text=Hola%20SmarterOS%2C%20quiero%20cotizar%20un%20plan%20empresarial."
              target="_blank"
              rel="noopener noreferrer"
            >
              Contactar por WhatsApp
            </Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-12 border-t bg-muted/30">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
          <p>© 2026 SmarterBot Chile. Todos los derechos reservados.</p>
          <p className="mt-2">
            <Link href="/terminos" className="underline-offset-4 hover:underline">
              Términos y condiciones
            </Link>{" "}
            ·{" "}
            <Link href="/privacidad" className="underline-offset-4 hover:underline">
              Privacidad
            </Link>
          </p>
        </div>
      </footer>
    </div>
  )
}
