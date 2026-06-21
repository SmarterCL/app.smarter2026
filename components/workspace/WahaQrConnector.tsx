"use client"

import { useEffect, useState, useCallback, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { QrCode, CheckCircle2, Loader2, AlertCircle, RefreshCw } from "lucide-react"

type WahaStatus = "connected" | "pending" | "disconnected" | "unknown"

interface WahaQrConnectorProps {
  tenantId: string | null
  onStatusChange: (status: WahaStatus) => void
  onConnected: () => void
  onOpenChange: (open: boolean) => void
}

export function WahaQrConnector({ tenantId, onStatusChange, onConnected, onOpenChange }: WahaQrConnectorProps) {
  const [qrData, setQrData] = useState<string | null>(null)
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [status, setStatus] = useState<WahaStatus>("unknown")
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const pollingRef = useRef<NodeJS.Timeout | null>(null)
  const tenantQuery = tenantId ? `?tenant_id=${encodeURIComponent(tenantId)}` : ""

  const fetchStatus = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/waha/status${tenantQuery}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `No se pudo leer el estado (${res.status})`)
      }
      const data = await res.json()
      const wahaState = data?.data?.status || data?.status || data?.data?.session?.status || "unknown"
      const mapped: WahaStatus =
        wahaState === "CONNECTED" || wahaState === "connected"
          ? "connected"
          : wahaState === "SCAN_QR" || wahaState === "pending" || wahaState === "WORKING"
          ? "pending"
          : wahaState === "STOPPED" || wahaState === "disconnected"
          ? "disconnected"
          : "unknown"

      setStatus(mapped)
      onStatusChange(mapped)
      setError(null)

      if (mapped === "connected") {
        if (pollingRef.current) clearInterval(pollingRef.current)
        onConnected()
      }
    } catch {
      setStatus("unknown")
      onStatusChange("unknown")
      setError("No se pudo consultar el estado de WAHA")
    } finally {
      setLoading(false)
    }
  }, [onStatusChange, onConnected, tenantId, tenantQuery])

  const fetchQr = useCallback(async () => {
    if (!tenantId) return
    try {
      const res = await fetch(`/api/waha/qr${tenantQuery}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `No se pudo obtener el QR (${res.status})`)
      }
      const data = await res.json()
      const qrImage = data?.data?.qr_image_url || data?.qr_image_url || null
      const qr = data?.data?.qr || data?.qr || data?.data?.code || null
      setQrImageUrl(qrImage)
      setQrData(qr)
    } catch {
      setQrImageUrl(null)
      setQrData(null)
      setError("No se pudo obtener el QR de WAHA")
    }
  }, [tenantId, tenantQuery])

  const createSession = async () => {
    if (!tenantId) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/waha/create${tenantQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `No se pudo crear la sesión (${res.status})`)
      }
      await fetchStatus()
      await fetchQr()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo crear la sesión"
      setError(message)
      console.error("Failed to create session", error)
    } finally {
      setCreating(false)
    }
  }

  const reconnect = async () => {
    if (!tenantId) return
    setCreating(true)
    setError(null)
    try {
      const res = await fetch(`/api/waha/reconnect${tenantQuery}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: tenantId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || `No se pudo reconectar (${res.status})`)
      }
      await fetchStatus()
      await fetchQr()
    } catch (error) {
      const message = error instanceof Error ? error.message : "No se pudo reconectar"
      setError(message)
      console.error("Failed to reconnect", error)
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (!tenantId) return
    fetchStatus().then(() => fetchQr())
    pollingRef.current = setInterval(() => {
      fetchStatus()
      if (status === "pending") fetchQr()
    }, 3000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [fetchStatus, fetchQr, status, tenantId])

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar canal
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {!tenantId ? (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <AlertCircle className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No hay tenant resuelto para este workspace
                </p>
              </CardContent>
            </Card>
          ) : loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : status === "connected" ? (
            <Card className="border-emerald-500/20 bg-emerald-500/10">
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                <p className="text-lg font-medium text-emerald-700">
                  Canal conectado
                </p>
                <p className="text-sm text-emerald-600">
                  La actividad se está sincronizando
                </p>
              </CardContent>
            </Card>
          ) : status === "pending" && (qrImageUrl || qrData) ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Escanea este código QR</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-3">
                <div className="rounded-xl bg-white p-4 shadow-sm">
                  {qrImageUrl ? (
                    <img
                      src={`${qrImageUrl}&t=${Date.now()}`}
                      alt="QR del canal"
                      className="h-64 w-64"
                    />
                  ) : (
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrData || "")}`}
                      alt="QR del canal"
                      className="h-64 w-64"
                    />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Esperando escaneo...
                </div>
                <p className="text-xs text-muted-foreground">
                  Abre el teléfono y vincula el canal desde la app correspondiente
                </p>
              </CardContent>
            </Card>
          ) : status === "disconnected" ? (
            <Card className="border-red-500/20 bg-red-500/10">
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <AlertCircle className="h-10 w-10 text-red-600" />
                <p className="text-sm font-medium text-red-700">Canal desconectado</p>
                <Button onClick={reconnect} disabled={creating} className="gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reconectar
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center gap-3 py-6">
                <QrCode className="h-10 w-10 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  Inicia la sesión del canal para ver el QR
                </p>
                {error ? (
                  <p className="max-w-sm text-center text-xs text-red-600">
                    {error}
                  </p>
                ) : null}
                <Button onClick={createSession} disabled={creating} className="gap-2">
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <QrCode className="h-4 w-4" />
                  )}
                  Crear sesión
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
