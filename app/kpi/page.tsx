"use client"

import { useState } from "react"

export default function KPIPage() {
  const [dashboardId, setDashboardId] = useState<number | "">(1)
  const [iframeUrl, setIframeUrl] = useState<string>("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>("")

  const generate = async () => {
    setLoading(true)
    setError("")
    setIframeUrl("")
    try {
      if (!dashboardId || Number.isNaN(Number(dashboardId))) {
        setError("Ingresa un ID de dashboard válido")
        setLoading(false)
        return
      }
      const res = await fetch("/api/metabase/embed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: { dashboard: Number(dashboardId) } }),
      })
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}))
        throw new Error(payload?.error || `Error ${res.status}`)
      }
      const payload = await res.json()
      setIframeUrl(payload.iframeUrl)
    } catch (e: any) {
      setError(e?.message || "Error desconocido")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <h1 className="text-2xl font-semibold">KPI (Metabase)</h1>
        <p className="text-sm text-muted-foreground">
          Esta página genera un token de Metabase (JWT) usando tu sesión de Supabase y embebe el dashboard solicitado.
        </p>

        <div className="flex items-center gap-3">
          <label className="text-sm" htmlFor="dashboardId">Dashboard ID</label>
          <input
            id="dashboardId"
            type="number"
            className="rounded border px-3 py-2 bg-background"
            value={dashboardId}
            onChange={(e) => setDashboardId(e.target.value === "" ? "" : Number(e.target.value))}
            placeholder="1"
            min={1}
          />
          <button
            onClick={generate}
            disabled={loading}
            className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Generando..." : "Ver dashboard"}
          </button>
        </div>

        {error ? (
          <div className="rounded border border-red-400 bg-red-50 p-3 text-sm text-red-700">{error}</div>
        ) : null}

        {iframeUrl ? (
          <div className="mt-4 overflow-hidden rounded border">
            <iframe
              title="Metabase Dashboard"
              src={iframeUrl}
              frameBorder="0"
              width="100%"
              height="900"
              allowTransparency
            />
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Ingresa el ID del dashboard de Metabase y presiona “Ver dashboard”.</p>
        )}
      </div>
    </div>
  )
}
