"use client"

import { Suspense, useState } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Loader2 } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, AlertCircle } from "lucide-react"

const plans = {
  starter: { name: "Starter", price: 25000 },
  growth: { name: "Growth", price: 59000 },
  pro: { name: "Pro", price: 180000 },
}

function validateRUT(rut: string): boolean {
  // Limpieza básica del RUT
  const value = rut.replace(/\./g, "").replace(/-/g, "").trim()
  if (value.length < 8) return false

  const cuerpo = value.slice(0, -1)
  const dv = value.slice(-1).toUpperCase()

  // Calcular dígito verificador
  let suma = 0
  let multiplo = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo.charAt(i), 10) * multiplo
    multiplo = multiplo === 7 ? 2 : multiplo + 1
  }

  const dvEsperado = 11 - (suma % 11)
  const dvCalculado = dvEsperado === 11 ? "0" : dvEsperado === 10 ? "K" : dvEsperado.toString()

  return dv === dvCalculado
}

function formatRUT(rut: string): string {
  const value = rut.replace(/\./g, "").replace(/-/g, "")
  if (value.length < 2) return value

  const cuerpo = value.slice(0, -1)
  const dv = value.slice(-1)

  // Formatear cuerpo con puntos
  const cuerpoFormateado = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, ".")

  return `${cuerpoFormateado}-${dv}`
}

interface FormData {
  rut: string
  razonSocial: string
  giro: string
  email: string
  password: string
  confirmPassword: string
  telefono: string
  nombreCompleto: string
}

export default function RegistroPageWrapper() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    }>
      <RegistroPage />
    </Suspense>
  )
}

function RegistroPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const selectedPlan = searchParams.get("plan") || "starter"

  const [formData, setFormData] = useState<FormData>({
    rut: "",
    razonSocial: "",
    giro: "",
    email: "",
    password: "",
    confirmPassword: "",
    telefono: "",
    nombreCompleto: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState("")

  const handleRUTChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    const formatted = formatRUT(value)
    setFormData((prev) => ({ ...prev, rut: formatted }))

    // Validar en tiempo real
    if (formatted.length >= 9) {
      const isValid = validateRUT(formatted)
      setErrors((prev) => ({
        ...prev,
        rut: isValid ? "" : "RUT inválido. Verifica el formato.",
      }))
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.rut || !validateRUT(formData.rut)) {
      newErrors.rut = "Ingresa un RUT válido"
    }
    if (!formData.razonSocial.trim()) {
      newErrors.razonSocial = "Razón social es requerida"
    }
    if (!formData.giro.trim()) {
      newErrors.giro = "Giro es requerido"
    }
    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Email inválido"
    }
    if (formData.password.length < 8) {
      newErrors.password = "La contraseña debe tener al menos 8 caracteres"
    }
    if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    if (!formData.telefono.trim() || formData.telefono.replace(/\D/g, "").length < 8) {
      newErrors.telefono = "Teléfono inválido (mínimo 8 dígitos)"
    }
    if (!formData.nombreCompleto.trim()) {
      newErrors.nombreCompleto = "Nombre completo es requerido"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitError("")

    if (!validateForm()) return

    setIsSubmitting(true)

    try {
      // Llamar a API real para crear tenant
      const response = await fetch('/api/tenant/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rut: formData.rut,
          razonSocial: formData.razonSocial,
          giro: formData.giro,
          email: formData.email,
          password: formData.password,
          telefono: formData.telefono,
          nombreCompleto: formData.nombreCompleto,
          plan: selectedPlan,
        }),
      })

      const contentType = response.headers.get("content-type") || ""
      const data = contentType.includes("application/json")
        ? await response.json()
        : { error: `Respuesta inesperada del servidor (${response.status}). Intenta nuevamente.` }

      if (!response.ok) {
        if (data.code === "TENANT_EXISTS" || data.code === "ACCOUNT_EXISTS") {
          router.push(`/login?email=${encodeURIComponent(formData.email)}`)
          return
        }
        throw new Error(data.error || 'Error al crear tu cuenta')
      }

      // Guardar datos del tenant en localStorage
      localStorage.setItem('tenant', JSON.stringify({
        tenant_id: data.tenant.tenant_id,
        api_key: data.api_key,
        plan: data.tenant.plan,
        status: data.tenant.status,
        limits: data.tenant.limits,
      }))

      // Redirigir a onboarding
      router.push('/dashboard/onboarding?new=true')
    } catch (error) {
      console.error('Registration error:', error)
      setSubmitError(
        error instanceof Error ? error.message : 'Error al crear tu cuenta. Intenta nuevamente o contacta soporte.'
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedPlanData = plans[selectedPlan as keyof typeof plans] || plans.starter

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/pricing" className="flex items-center gap-2">
            <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
              ← Volver a planes
            </Badge>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-3xl font-semibold tracking-tight text-foreground">Crea tu cuenta</h1>
          <p className="text-muted-foreground">
            Plan seleccionado: <span className="font-semibold text-foreground">{selectedPlanData.name}</span> -{" "}
            <span className="text-emerald-600">${selectedPlanData.price.toLocaleString("es-CL")}/mes</span>
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Información de tu negocio</CardTitle>
            <CardDescription>Completa los datos para activar tu QR inteligente</CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              )}

              {/* RUT */}
              <div className="space-y-2">
                <Label htmlFor="rut">RUT de la empresa *</Label>
                <Input
                  id="rut"
                  placeholder="76.123.456-K"
                  value={formData.rut}
                  onChange={handleRUTChange}
                  className={errors.rut ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.rut && <p className="text-xs text-red-500">{errors.rut}</p>}
              </div>

              {/* Razón Social */}
              <div className="space-y-2">
                <Label htmlFor="razonSocial">Razón social *</Label>
                <Input
                  id="razonSocial"
                  placeholder="Ej: Restaurante SpA"
                  value={formData.razonSocial}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, razonSocial: e.target.value }))}
                  className={errors.razonSocial ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.razonSocial && <p className="text-xs text-red-500">{errors.razonSocial}</p>}
              </div>

              {/* Giro */}
              <div className="space-y-2">
                <Label htmlFor="giro">Giro comercial *</Label>
                <Input
                  id="giro"
                  placeholder="Ej: Restaurante, Retail, Servicios..."
                  value={formData.giro}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, giro: e.target.value }))}
                  className={errors.giro ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.giro && <p className="text-xs text-red-500">{errors.giro}</p>}
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">Email corporativo *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="contacto@tuempresa.cl"
                  value={formData.email}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, email: e.target.value }))}
                  className={errors.email ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="password">Contraseña *</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, password: e.target.value }))}
                  className={errors.password ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña *</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Repite la contraseña"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, confirmPassword: e.target.value }))}
                  className={errors.confirmPassword ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Teléfono */}
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono / WhatsApp *</Label>
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+56 9 1234 5678"
                  value={formData.telefono}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, telefono: e.target.value }))}
                  className={errors.telefono ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.telefono && <p className="text-xs text-red-500">{errors.telefono}</p>}
              </div>

              {/* Nombre completo */}
              <div className="space-y-2">
                <Label htmlFor="nombreCompleto">Nombre completo (representante) *</Label>
                <Input
                  id="nombreCompleto"
                  placeholder="Nombre y apellido"
                  value={formData.nombreCompleto}
                  onChange={(e) => setFormData((prev: FormData) => ({ ...prev, nombreCompleto: e.target.value }))}
                  className={errors.nombreCompleto ? "border-red-500" : ""}
                  disabled={isSubmitting}
                />
                {errors.nombreCompleto && <p className="text-xs text-red-500">{errors.nombreCompleto}</p>}
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
                {isSubmitting ? "Creando cuenta..." : "Crear cuenta y activar QR"}
              </Button>

              <p className="text-center text-xs text-muted-foreground">
                Al crear tu cuenta, aceptas nuestros{" "}
                <Link href="/terminos" className="underline-offset-4 hover:underline">
                  términos y condiciones
                </Link>
              </p>
            </form>
          </CardContent>
        </Card>

        {/* Trust indicators */}
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <div className="flex items-center gap-2 text-center">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Activación en 5 min</span>
          </div>
          <div className="flex items-center gap-2 text-center">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Sin tarjeta requerida</span>
          </div>
          <div className="flex items-center gap-2 text-center">
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-muted-foreground">Soporte WhatsApp</span>
          </div>
        </div>
      </main>
    </div>
  )
}
