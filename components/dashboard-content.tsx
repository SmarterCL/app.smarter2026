"use client"

import { useEffect, useState } from "react"
import { UserButton, useUser } from "@/lib/client-auth"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import ChatwootWidget from "@/components/chatwoot-widget"

import {
  Activity,
  BarChart3,
  Bot,
  Database,
  Filter,
  Key,
  MessageSquare,
  Plus,
  QrCode,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Upload,
  Users,
  Zap,
} from "lucide-react"

const overviewStats = [
  { title: "Mensajes enviados", value: "2,847", delta: "+12%", icon: MessageSquare },
  { title: "Contactos activos", value: "1,234", delta: "+5%", icon: Users },
  { title: "Automatizaciones", value: "12", delta: "3 activas", icon: Zap },
  { title: "Tasa de respuesta", value: "89.2%", delta: "+2.1%", icon: BarChart3 },
]

const tabItems = [
  { value: "overview", label: "Overview", icon: BarChart3 },
  { value: "messages", label: "Mensajes", icon: MessageSquare },
  { value: "contacts", label: "Contactos", icon: Users },
  { value: "automation", label: "Automatización", icon: Zap },
  { value: "qr", label: "QR Codes", icon: QrCode },
  { value: "api", label: "API Keys", icon: Key },
  { value: "settings", label: "Configuración", icon: Settings },
]

const dateTimeFormatter = new Intl.DateTimeFormat("es-CL", {
  dateStyle: "medium",
  timeStyle: "short",
})

const formatDateTime = (value?: number | Date | null) => {
  if (!value) return "Sin registro"

  try {
    const date = value instanceof Date ? value : new Date(value)

    if (Number.isNaN(date.getTime())) {
      return "Sin registro"
    }

    return dateTimeFormatter.format(date)
  } catch (error) {
    return "Sin registro"
  }
}

const getInitials = (value?: string | null) => {
  if (!value) return "??"

  const trimmed = value.trim()
  if (!trimmed) return "??"

  const parts = trimmed.split(/\s+/)
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

type SyncedContact = {
  id: string
  email: string
  name: string
  source?: string | null
  status?: string | null
  was_notified?: boolean | null
  created_at?: string | null
  updated_at?: string | null
}

export default function DashboardContent() {
  const [activeTab, setActiveTab] = useState("overview")
  const { user, isLoaded } = useUser()
  const [supabaseContact, setSupabaseContact] = useState<SyncedContact | null>(null)
  const [syncState, setSyncState] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [syncError, setSyncError] = useState<string | null>(null)

  useEffect(() => {
    if (!isLoaded || !user) {
      return
    }

    let isMounted = true

    const syncContact = async () => {
      setSyncState("loading")
      setSyncError(null)

      try {
        const response = await fetch("/api/contacts/me")

        if (!response.ok) {
          const payload = await response.json().catch(() => ({}))
          throw new Error(payload?.error || "No se pudo sincronizar el contacto")
        }

        const payload = (await response.json()) as { contact: SyncedContact }

        if (!isMounted) return

        setSupabaseContact(payload.contact)
        setSyncState("success")
      } catch (error) {
        console.error("Failed to sync contact", error)
        if (!isMounted) return
        setSyncState("error")
        setSyncError(error instanceof Error ? error.message : "No se pudo sincronizar el contacto")
      }
    }

    syncContact()

    return () => {
      isMounted = false
    }
  }, [isLoaded, user])

  const contactProfile = user
    ? {
        id: user.id,
        name: user.fullName?.trim() || user.username || user.primaryEmailAddress?.emailAddress || "Usuario sin nombre",
        email: user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || "Sin correo registrado",
        phone: user.phoneNumbers?.[0]?.phoneNumber || "Sin teléfono",
        lastAccess: formatDateTime(user.lastSignInAt),
        createdAt: formatDateTime(user.createdAt),
        imageUrl: user.imageUrl,
        emailStatus: user.primaryEmailAddress?.verification?.status ?? "pending",
      }
    : null

  const contactDetails = contactProfile
    ? [
        { label: "Último acceso", value: contactProfile.lastAccess },
        { label: "Creado el", value: contactProfile.createdAt },
        { label: "ID Supabase", value: contactProfile.id },
        { label: "Teléfono", value: contactProfile.phone },
      ]
    : []

  const supabaseDetails = supabaseContact
    ? [
        { label: "Estado CRM", value: supabaseContact.status || "Sin estado" },
        { label: "Fuente", value: supabaseContact.source || "Desconocida" },
        { label: "Notificaciones", value: supabaseContact.was_notified ? "Enviadas" : "Pendiente" },
        {
          label: "Actualizado en Supabase",
          value: formatDateTime(supabaseContact.updated_at ? new Date(supabaseContact.updated_at) : null),
        },
      ]
    : []

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-secondary">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">SmarterOS Dashboard</h1>
              <p className="text-xs text-muted-foreground">Automatización WhatsApp + IA</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Badge className="flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
              <Activity className="h-3 w-3" /> Online
            </Badge>
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-10 w-10",
                  userButtonPopoverCard: "bg-card border-border",
                  userButtonPopoverActionButton: "text-foreground hover:bg-secondary",
                },
              }}
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {overviewStats.map(({ title, value, delta, icon: Icon }) => (
            <Card key={title} className="border border-border bg-card shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
                <Icon className="h-4 w-4 text-accent" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-semibold text-foreground">{value}</div>
                <p className="text-xs text-muted-foreground">{delta}</p>
              </CardContent>
            </Card>
          ))}
        </section>

        <section className="mt-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
            <div className="flex flex-col gap-3">
              <div className="sm:hidden">
                <Select value={activeTab} onValueChange={setActiveTab}>
                  <SelectTrigger className="w-full rounded-2xl border border-border bg-secondary text-left text-sm font-semibold">
                    <SelectValue placeholder="Selecciona una sección" />
                  </SelectTrigger>
                  <SelectContent align="start" className="min-w-[220px] rounded-xl border border-border bg-card shadow-lg">
                    {tabItems.map(({ value, label, icon: Icon }) => (
                      <SelectItem key={value} value={value} className="text-sm">
                        <span className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <TabsList className="hidden w-full grid-cols-2 gap-2 rounded-2xl border border-border bg-secondary p-1 sm:grid sm:grid-cols-3 lg:grid-cols-6">
                {tabItems.map(({ value, label, icon: Icon }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    className="flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-transparent text-sm font-semibold text-muted-foreground transition data-[state=active]:border-border data-[state=active]:bg-background data-[state=active]:text-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            <TabsContent value="overview" className="space-y-6 sm:space-y-8">
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-foreground">Actividad reciente</CardTitle>
                    <CardDescription className="text-muted-foreground">Últimas interacciones con contactos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="flex items-center gap-3 rounded-lg border border-border bg-secondary p-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
                          <MessageSquare className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Mensaje enviado a +56 9 1234 5678</p>
                          <p className="text-xs text-muted-foreground">Hace 2 minutos</p>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="border border-border bg-card shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-foreground">Estado del sistema</CardTitle>
                    <CardDescription className="text-muted-foreground">Monitoreo en tiempo real</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { label: "WhatsApp API", icon: Shield },
                      { label: "Base de datos", icon: Database },
                      { label: "IA Assistant", icon: Bot },
                    ].map(({ label, icon: Icon }) => (
                      <div key={label} className="flex items-center justify-between rounded-lg border border-border bg-secondary p-3">
                        <div className="flex items-center gap-3">
                          <Icon className="h-5 w-5 text-accent" />
                          <span className="text-sm text-foreground">{label}</span>
                        </div>
                        <Badge className="border border-accent/30 bg-accent/10 text-accent">Activo</Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="messages" className="space-y-6 sm:space-y-8">
              <ChatwootWidget />
            </TabsContent>

            <TabsContent value="contacts" className="space-y-6 sm:space-y-8">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">Gestión de contactos</CardTitle>
                      <CardDescription className="text-muted-foreground">Administra tu base de contactos</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button className="inline-flex items-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                        <Plus className="h-4 w-4" /> Nuevo contacto
                      </Button>
                      <Button variant="outline" className="border border-border text-foreground hover:bg-secondary">
                        <Upload className="h-4 w-4" /> Importar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-6 flex items-center gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Buscar contactos..."
                        className="pl-10 border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <Button variant="outline" className="border border-border text-foreground hover:bg-secondary">
                      <Filter className="h-4 w-4" /> Filtros
                    </Button>
                  </div>
                  {!isLoaded ? (
                    <div className="rounded-xl border border-border bg-secondary/70 p-6">
                      <div className="space-y-4">
                        <Skeleton className="h-8 w-1/3 bg-muted" />
                        <Skeleton className="h-4 w-1/2 bg-muted" />
                        <Skeleton className="h-24 w-full bg-muted" />
                      </div>
                    </div>
                  ) : contactProfile ? (
                    <div className="space-y-6">
                      <div className="flex flex-col gap-4 rounded-xl border border-border bg-secondary/70 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-14 w-14 border border-border">
                            <AvatarImage src={contactProfile.imageUrl} alt={contactProfile.name} />
                            <AvatarFallback className="text-sm font-semibold text-foreground">
                              {getInitials(contactProfile.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                              Contacto autenticado
                            </p>
                            <p className="text-lg font-semibold text-foreground">{contactProfile.name}</p>
                            <p className="text-sm text-muted-foreground">{contactProfile.email}</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="border-accent/30 bg-accent/10 text-accent">
                            Fuente: Supabase
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              contactProfile.emailStatus === "verified"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                : "border-amber-500/30 bg-amber-500/10 text-amber-600"
                            }
                          >
                            Email {contactProfile.emailStatus === "verified" ? "verificado" : "pendiente"}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={
                              syncState === "success"
                                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-500"
                                : syncState === "error"
                                  ? "border-destructive/30 bg-destructive/10 text-destructive"
                                  : "border-accent/30 bg-accent/10 text-accent"
                            }
                          >
                            {syncState === "loading" && (
                              <RefreshCw className="mr-1 h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                            )}
                            {syncState === "success"
                              ? "Sincronizado con Supabase"
                              : syncState === "error"
                                ? "Error al sincronizar"
                                : "Sincronizando..."}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        {[...contactDetails, ...supabaseDetails].map(({ label, value }) => (
                          <div key={label} className="rounded-xl border border-border bg-card/70 p-4">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
                            <p className="mt-1 text-sm font-medium text-foreground break-words">{value}</p>
                          </div>
                        ))}
                      </div>
                      {syncError ? (
                        <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                          {syncError}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-border bg-secondary py-12 text-center">
                      <Users className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">
                        No pudimos recuperar los datos del usuario autenticado
                      </p>
                      <p className="mb-4 text-xs text-muted-foreground">Verifica tu sesión de Supabase para continuar</p>
                      <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Actualizar sesión</Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="automation" className="space-y-6 sm:space-y-8">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">Automatizaciones</CardTitle>
                      <CardDescription className="text-muted-foreground">Configura flujos automáticos</CardDescription>
                    </div>
                    <Button className="inline-flex items-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Plus className="h-4 w-4" /> Nueva automatización
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="rounded-xl border border-border bg-secondary py-12 text-center">
                    <Zap className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No hay automatizaciones configuradas</p>
                    <p className="mb-4 text-xs text-muted-foreground">Crea tu primera automatización para WhatsApp</p>
                    <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Crear automatización</Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="qr" className="space-y-6 sm:space-y-8">
              <QRCodeSection />
            </TabsContent>

            <TabsContent value="api" className="space-y-6 sm:space-y-8">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-foreground">API Keys</CardTitle>
                      <CardDescription className="text-muted-foreground">Gestiona tus claves de API</CardDescription>
                    </div>
                    <Button className="inline-flex items-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90">
                      <Plus className="h-4 w-4" /> Nueva API Key
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="whatsapp-api" className="text-xs font-medium text-muted-foreground">
                        WhatsApp Business API
                      </Label>
                      <Input
                        id="whatsapp-api"
                        placeholder="Ingresa tu API key"
                        className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor="openai-api" className="text-xs font-medium text-muted-foreground">
                        OpenAI API Key
                      </Label>
                      <Input
                        id="openai-api"
                        placeholder="Ingresa tu API key"
                        className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                      />
                    </div>
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Guardar configuración</Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings" className="space-y-6 sm:space-y-8">
              <Card className="border border-border bg-card shadow-sm">
                <CardHeader>
                  <CardTitle className="text-foreground">Configuración general</CardTitle>
                  <CardDescription className="text-muted-foreground">Personaliza tu experiencia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="business-name" className="text-xs font-medium text-muted-foreground">
                      Nombre del negocio
                    </Label>
                    <Input
                      id="business-name"
                      placeholder="Mi Empresa"
                      className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="webhook-url" className="text-xs font-medium text-muted-foreground">
                      Webhook URL
                    </Label>
                    <Input
                      id="webhook-url"
                      placeholder="https://mi-webhook.com/endpoint"
                      className="border-border bg-secondary text-foreground placeholder:text-muted-foreground"
                    />
                  </div>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Guardar cambios</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </section>
      </main>
    </div>
  )
}

function QRCodeSection() {
  const [qrCodes, setQRCodes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [showGenerateForm, setShowGenerateForm] = useState(false)
  const [formData, setFormData] = useState({
    phoneNumber: "",
    message: "Hola! Estoy interesado en tus servicios",
    name: "",
  })

  const fetchQRCodes = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/qr-codes")
      const data = await response.json()
      if (data.success) {
        setQRCodes(data.data || [])
      }
    } catch (error) {
      console.error("Error fetching QR codes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchQRCodes()
  }, [])

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)
    try {
      const response = await fetch("/api/qr-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await response.json()
      if (data.success) {
        setQRCodes((prev) => [data.data, ...prev])
        setShowGenerateForm(false)
        setFormData({ phoneNumber: "", message: "Hola! Estoy interesado en tus servicios", name: "" })
        fetchQRCodes()
      }
    } catch (error) {
      console.error("Error generating QR code:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDownload = async (qrCode: any) => {
    try {
      const response = await fetch(qrCode.qr_code_url || qrCode.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `qr-${qrCode.name || "whatsapp"}.png`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading QR code:", error)
    }
  }

  return (
    <Card className="border border-border bg-card shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-foreground">Códigos QR</CardTitle>
            <CardDescription className="text-muted-foreground">Genera códigos QR para WhatsApp</CardDescription>
          </div>
          <Button
            onClick={() => setShowGenerateForm(!showGenerateForm)}
            className="inline-flex items-center gap-2 bg-accent text-accent-foreground hover:bg-accent/90"
          >
            <Plus className="h-4 w-4" /> {showGenerateForm ? "Cancelar" : "Generar QR"}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {showGenerateForm && (
          <Card className="border border-border bg-secondary/50">
            <CardHeader>
              <CardTitle className="text-base">Nuevo Código QR</CardTitle>
              <CardDescription className="text-muted-foreground">
                Configura los datos para tu código QR de WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleGenerate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Número de WhatsApp *
                  </Label>
                  <Input
                    id="phone"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    placeholder="56912345678"
                    required
                    className="border-border bg-background"
                  />
                  <p className="text-xs text-muted-foreground">Incluye el código de país (ej: 569...)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Nombre del QR
                  </Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="QR Principal"
                    className="border-border bg-background"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message" className="text-sm font-medium">
                    Mensaje predeterminado
                  </Label>
                  <Input
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Hola! Estoy interesado..."
                    className="border-border bg-background"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    disabled={isGenerating}
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Generando...
                      </>
                    ) : (
                      <>
                        <QrCode className="h-4 w-4 mr-2" /> Generar Código QR
                      </>
                    )}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowGenerateForm(false)}
                    className="border border-border"
                  >
                    Cancelar
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        {isLoading ? (
          <div className="rounded-xl border border-border bg-secondary py-12 text-center">
            <RefreshCw className="mx-auto mb-4 h-10 w-10 text-muted-foreground animate-spin" />
            <p className="text-sm text-muted-foreground">Cargando códigos QR...</p>
          </div>
        ) : qrCodes.length === 0 ? (
          <div className="rounded-xl border border-border bg-secondary py-12 text-center">
            <QrCode className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No hay códigos QR generados</p>
            <p className="mb-4 text-xs text-muted-foreground">Crea códigos QR para facilitar el contacto</p>
            <Button onClick={() => setShowGenerateForm(true)} className="bg-accent text-accent-foreground hover:bg-accent/90">
              Generar primer QR
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {qrCodes.map((qr, index) => (
              <Card key={index} className="border border-border bg-card hover:shadow-md transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex flex-col items-center gap-4">
                    {qr.qr_code_url || qr.url ? (
                      <img
                        src={qr.qr_code_url || qr.url}
                        alt={qr.name || "QR Code"}
                        className="w-48 h-48 object-contain rounded-lg border border-border bg-background p-2"
                      />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center border border-border bg-secondary rounded-lg">
                        <QrCode className="h-24 w-24 text-muted-foreground" />
                      </div>
                    )}
                    <div className="text-center">
                      <p className="font-semibold text-foreground">{qr.name || `QR #${index + 1}`}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {qr.phone_number || qr.phoneNumber || "WhatsApp"}
                      </p>
                    </div>
                    <div className="flex gap-2 w-full">
                      <Button
                        onClick={() => handleDownload(qr)}
                        variant="outline"
                        className="flex-1 border border-border text-xs"
                      >
                        Descargar
                      </Button>
                      <Button
                        onClick={() => {
                          const url = qr.qr_code_url || qr.url
                          if (url) window.open(url, "_blank")
                        }}
                        variant="outline"
                        className="flex-1 border border-border text-xs"
                      >
                        Ver
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
