"use client"

import { useEffect, useState } from "react"

interface Settings {
  business_name: string
  webhook_url: string
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({ business_name: "", webhook_url: "" })
  const [error, setError] = useState<string>("")

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

  return (
    <div className="min-h-screen bg-background p-6 text-foreground">
      <div className="mx-auto max-w-3xl space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Configuración</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajustes del SaaS. Sin exposición de runtime ni chequeos de infraestructura.
          </p>
        </div>

        {error ? <div className="rounded border border-red-400 bg-red-50 p-3 text-sm text-red-700">{error}</div> : null}

        <div className="space-y-4 rounded border border-border bg-card p-4">
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
      </div>
    </div>
  )
}
