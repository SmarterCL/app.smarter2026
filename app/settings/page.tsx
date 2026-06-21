"use client"

import { useEffect, useState } from "react"

interface Settings {
  business_name: string
  webhook_url: string
}

interface ServiceResult {
  url: string
  ok: boolean
  status: number
  error?: string
}

const DEFAULT_URLS = [
  "https://chat.smarterbot.store",
  "https://odoo.smarterbot.store",
  "https://kpi.smarterbot.store",
]

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({ business_name: "", webhook_url: "" })
  const [serviceChecks, setServiceChecks] = useState<ServiceResult[]>([])
  const [error, setError] = useState<string>("")
  const [statusLoading, setStatusLoading] = useState(false)

  const loadSettings = async () => {
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/settings")
      if (!res.ok) throw new Error("Error cargando configuración")
      const data = await res.json()
      setSettings(data.settings)
    } catch (e: any) {
      setError(e?.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSettings()
  }, [])

  const save = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || "Error guardando")
      }
      await loadSettings()
    } catch (e: any) {
      setError(e?.message || "Error desconocido")
    } finally {
      setSaving(false)
    }
  }

  const checkServices = async () => {
    setStatusLoading(true)
    setServiceChecks([])
    try {
      const res = await fetch("/api/service-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls: DEFAULT_URLS }),
      })
      if (!res.ok) throw new Error("Error verificando servicios")
      const data = await res.json()
      setServiceChecks(data.results)
    } catch (e: any) {
      setError(e?.message || "Error desconocido")
    } finally {
      setStatusLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <h1 className="text-2xl font-semibold">Configuración general</h1>
        <p className="text-sm text-muted-foreground">Personaliza tu experiencia y verifica el estado de tus servicios conectados.</p>

        {error ? <div className="rounded border border-red-400 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="space-y-4 rounded border border-border bg-secondary p-4">
          <h2 className="text-lg font-medium">Datos del negocio</h2>
          <div className="flex flex-col gap-3">
            <label className="text-sm">
              Nombre del negocio
              <input
                className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm"
                value={settings.business_name}
                onChange={(e) => setSettings((s) => ({ ...s, business_name: e.target.value }))}
                placeholder="Mi Empresa"
              />
            </label>
            <label className="text-sm">
              Webhook URL
              <input
                className="mt-1 w-full rounded border bg-background px-3 py-2 text-sm"
                value={settings.webhook_url}
                onChange={(e) => setSettings((s) => ({ ...s, webhook_url: e.target.value }))}
                placeholder="https://mi-webhook.com/endpoint"
              />
            </label>
            <button
              onClick={save}
              disabled={saving}
              className="w-fit rounded bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? "Guardando..." : "Guardar cambios"}
            </button>
            {loading ? <p className="text-xs text-muted-foreground">Cargando configuración...</p> : null}
          </div>
        </div>

        <div className="space-y-4 rounded border border-border bg-secondary p-4">
          <h2 className="text-lg font-medium">Estado de servicios</h2>
          <p className="text-xs text-muted-foreground">Verifica conectividad básica (HEAD) para cada subdominio.</p>
          <button
            onClick={checkServices}
            disabled={statusLoading}
            className="w-fit rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {statusLoading ? "Verificando..." : "Verificar servicios"}
          </button>
          <div className="grid gap-2 sm:grid-cols-2">
            {serviceChecks.map((r) => (
              <div key={r.url} className="rounded border bg-background p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium truncate" title={r.url}>{r.url.replace(/^https?:\/\//,'')}</span>
                  <span className={r.ok ? "text-emerald-600" : "text-red-600"}>{r.ok ? "OK" : "FALLA"}</span>
                </div>
                <p className="text-[11px] text-muted-foreground">Status: {r.status}{r.error ? ` (${r.error})` : ""}</p>
              </div>
            ))}
            {!serviceChecks.length && !statusLoading ? (
              <p className="text-xs text-muted-foreground">Aún no se han verificado servicios.</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
