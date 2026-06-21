import Link from "next/link"
import { ArrowRight, QrCode, Zap, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export const dynamic = "force-dynamic"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-background/50">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              qr.smarterbot.store
            </Badge>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Iniciar sesión
            </Link>
            <Button asChild size="sm">
              <Link href="/pricing">Ver planes</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="mb-16 text-center">
          <Badge className="mb-4 rounded-full border border-accent/30 bg-accent/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-accent">
            SaaS Chile
          </Badge>
          <h1 className="mb-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            QR que vende solo
          </h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Automatiza tu restaurante o negocio con QR inteligente. Menú digital, pagos y soporte
            sin garzón.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild size="lg" className="gap-2">
              <Link href="/pricing">
                Comenzar ahora
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="https://wa.me/56979540471" target="_blank" rel="noopener noreferrer">
                Demo por WhatsApp
              </Link>
            </Button>
          </div>
        </div>

        {/* Value Props */}
        <div className="mb-16 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                <QrCode className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-foreground">QR Inteligente</h3>
            <p className="text-sm text-muted-foreground">
              Un solo código para menú, pagos y contacto. Actualiza contenido sin reimprimir.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Mesa sin garzón</h3>
            <p className="text-sm text-muted-foreground">
              Los clientes piden y pagan desde su celular. Reduce costos operativos.
            </p>
          </div>

          <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
            <div className="mb-4 flex justify-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <h3 className="mb-2 font-semibold text-foreground">Más ventas</h3>
            <p className="text-sm text-muted-foreground">
              Fotos de platos, sugerencias automáticas y upselling integrado.
            </p>
          </div>
        </div>

        {/* Target Audience */}
        <div className="mb-16 rounded-2xl border bg-muted/30 p-8">
          <h2 className="mb-6 text-center text-2xl font-semibold text-foreground">
            Diseñado para negocios reales
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-dashed border-emerald-400/40 bg-emerald-500/10 p-4 text-center">
              <p className="font-semibold text-emerald-700">Restaurantes</p>
              <p className="text-xs text-emerald-600">Menú digital + pagos</p>
            </div>
            <div className="rounded-xl border border-dashed border-blue-400/40 bg-blue-500/10 p-4 text-center">
              <p className="font-semibold text-blue-700">Centros médicos</p>
              <p className="text-xs text-blue-600">Flujo ordenado</p>
            </div>
            <div className="rounded-xl border border-dashed border-purple-400/40 bg-purple-500/10 p-4 text-center">
              <p className="font-semibold text-purple-700">Turismo</p>
              <p className="text-xs text-purple-600">Alto ticket</p>
            </div>
          </div>
        </div>

        {/* Pricing CTA */}
        <div className="rounded-2xl border bg-card p-8 text-center shadow-lg">
          <h2 className="mb-2 text-2xl font-semibold text-foreground">Listo para comenzar?</h2>
          <p className="mb-6 text-muted-foreground">
            Planes desde $25.000/mes. Activación en 5 minutos.
          </p>
          <Button asChild size="lg">
            <Link href="/pricing">Ver planes y precios</Link>
          </Button>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t bg-muted/30">
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
