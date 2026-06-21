"use client"

import { useEffect, useState, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Search,
  QrCode,
  MessageSquare,
  Building2,
  Clock3,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import type { ChatwootConversation } from "@/lib/chatwoot-client"

type WahaStatus = "connected" | "pending" | "disconnected" | "unknown"

async function readJsonSafely(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  if (contentType.includes("application/json")) {
    return response.json()
  }

  const text = await response.text()
  return {
    success: false,
    error: text || `Respuesta inválida (${response.status})`,
    raw: text,
  }
}

interface ConversationListProps {
  selectedId: number | null
  onSelect: (conversationId: number, contactId?: number) => void
  wahaStatus: WahaStatus
  onConnectWaha: () => void
  tenantId: string | null
}

export function ConversationList({
  selectedId,
  onSelect,
  wahaStatus,
  onConnectWaha,
  tenantId,
}: ConversationListProps) {
  const [conversations, setConversations] = useState<ChatwootConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved" | "pending" | "all">("open")

  const fetchConversations = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (tenantId) params.set("tenant_id", tenantId)
      const res = await fetch(`/api/chatwoot/conversations?${params}`)
      const data = await readJsonSafely(res)
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `No se pudieron cargar conversaciones (${res.status})`)
      }
      if (data.success && data.data) {
        const payload = data.data.payload || data.data
        setConversations(Array.isArray(payload) ? payload : [])
      }
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudieron cargar conversaciones"
      setError(message)
      setConversations([])
      console.error("Failed to fetch conversations:", err)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, tenantId])

  useEffect(() => {
    fetchConversations()
    const interval = setInterval(fetchConversations, 15000)
    return () => clearInterval(interval)
  }, [fetchConversations])

  const filtered = conversations.filter((c) => {
    if (!search) return true
    const name = c.meta?.sender?.name || ""
    const phone = c.meta?.sender?.phone_number || ""
    return name.toLowerCase().includes(search.toLowerCase()) ||
      phone.includes(search)
  })

  const formatTime = (ts: number) => {
    const date = new Date(ts * 1000)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 60) return `${mins}m`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h`
    return date.toLocaleDateString("es-CL", { day: "2-digit", month: "2-digit" })
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2)
  }

  const lastMessage = (conv: ChatwootConversation) => {
    const msgs = conv.messages || []
    if (msgs.length === 0) return ""
    const last = msgs[msgs.length - 1]
    return last.content?.slice(0, 60) || ""
  }

  return (
    <div className="flex h-full flex-col border-r">
      <div className="flex items-center justify-between p-3 border-b">
        <h2 className="text-sm font-semibold">Contactos y casos</h2>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className={statusFilter === "open" ? "bg-primary/10" : ""}
            onClick={() => setStatusFilter("open")}
          >
            Activos
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={statusFilter === "all" ? "bg-primary/10" : ""}
            onClick={() => setStatusFilter("all")}
          >
            Todas
          </Button>
        </div>
      </div>

      <div className="p-3 border-b">
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar contacto o empresa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
          />
        </div>
      </div>

      {wahaStatus !== "connected" && (
        <div className="p-3 border-b bg-yellow-500/10">
          <div className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-700">Canal pendiente de conexión</span>
            <Button size="sm" variant="outline" className="ml-auto h-7 gap-1" onClick={onConnectWaha}>
              <QrCode className="h-3 w-3" />
              Abrir canal
            </Button>
          </div>
        </div>
      )}

      <ScrollArea className="flex-1">
        {loading ? (
          <div className="p-4 text-center text-sm text-muted-foreground">
            Cargando...
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <AlertCircle className="mx-auto h-8 w-8 text-red-500/70" />
            <p className="mt-2 text-sm font-medium text-red-700">
              Error cargando conversaciones
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {error}
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 gap-1"
              onClick={fetchConversations}
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-6 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-muted-foreground/40" />
            <p className="mt-2 text-sm text-muted-foreground">
              {wahaStatus !== "connected"
                ? "Conecta el canal para ver actividad"
                : "Sin actividad"}
            </p>
          </div>
        ) : (
          <div className="space-y-0.5 p-1">
            {filtered.map((conv) => {
              const isSelected = conv.id === selectedId
              const sender = conv.meta?.sender
              const unread = conv.unread_count || 0
              const companyName =
                sender?.custom_attributes?.company_name ||
                sender?.additional_attributes?.company_name ||
                sender?.custom_attributes?.company ||
                ""

              return (
                <button
                  key={conv.id}
                  onClick={() => onSelect(conv.id, sender?.id)}
                  className={`w-full rounded-lg p-3 text-left transition-colors ${
                    isSelected
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-muted/50"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback className="text-xs font-medium">
                        {sender?.name ? getInitials(sender.name) : "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium truncate">
                          {sender?.name || "Contacto sin nombre"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {conv.timestamp ? formatTime(conv.timestamp) : ""}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {companyName ? companyName : "Sin empresa"}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {conv.status || "active"}
                        </span>
                        {unread > 0 && (
                          <Badge className="h-5 px-1.5 text-xs">
                            {unread}
                          </Badge>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground truncate">
                        {lastMessage(conv) || "Sin último evento"}
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
