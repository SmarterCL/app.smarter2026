"use client"

import { useEffect, useState, useRef, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import {
  Send,
  MoreVertical,
  CheckCheck,
  ArrowDownLeft,
  ArrowUpRight,
  CalendarClock,
  UserRound,
  AlertCircle,
  RefreshCw,
} from "lucide-react"
import type { ChatwootMessage } from "@/lib/chatwoot-client"

interface MessageThreadProps {
  conversationId: number | null
  onContactSelect: (contactId: number) => void
}

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

export function MessageThread({ conversationId, onContactSelect }: MessageThreadProps) {
  const [messages, setMessages] = useState<ChatwootMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [newMessage, setNewMessage] = useState("")
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const fetchMessages = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/chatwoot/conversations/${conversationId}/messages`)
      const data = await readJsonSafely(res)
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `No se pudo cargar la actividad (${res.status})`)
      }
      if (data.success && data.data) {
        const payload = data.data.payload || data.data
        setMessages(Array.isArray(payload) ? payload : [])
      }
      setError(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo cargar la actividad"
      setError(message)
      setMessages([])
      console.error("Failed to fetch messages:", err)
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    fetchMessages()
    const interval = setInterval(fetchMessages, 10000)
    return () => clearInterval(interval)
  }, [fetchMessages])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const sendMessage = async () => {
    if (!conversationId || !newMessage.trim() || sending) return
    setSending(true)
    try {
      const res = await fetch(`/api/chatwoot/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newMessage.trim(), message_type: "outgoing" }),
      })
      const data = await readJsonSafely(res)
      if (!res.ok || !data.success) {
        throw new Error(data?.error || `No se pudo enviar el mensaje (${res.status})`)
      }
      setNewMessage("")
      setError(null)
      await fetchMessages()
    } catch (err) {
      const message = err instanceof Error ? err.message : "No se pudo enviar el mensaje"
      setError(message)
      console.error("Failed to send message:", err)
    } finally {
      setSending(false)
    }
  }

  const formatMessageTime = (ts: number) => {
    const date = new Date(ts * 1000)
    return date.toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit" })
  }

  const formatMessageDate = (ts: number) => {
    const date = new Date(ts * 1000)
    return date.toLocaleDateString("es-CL", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (!conversationId) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <CalendarClock className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <div>
            <h3 className="text-lg font-medium text-foreground">Selecciona un caso</h3>
            <p className="text-sm text-muted-foreground">
              Elige un contacto para ver su actividad operativa
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-3">
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
          <div>
            <h2 className="text-sm font-semibold">Actividad</h2>
            <p className="text-xs text-muted-foreground">
              Registro de interacción y respuesta
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="border-b px-3 py-2">
          {(() => {
            const contactMsg = messages.find((m) => m.message_type === 0)
            const sender = contactMsg?.sender
            return sender ? (
              <button
                onClick={() => sender.type === "contact" && onContactSelect(sender.id)}
                className="inline-flex items-center gap-2 rounded-md border bg-muted/40 px-2 py-1 text-left text-xs text-muted-foreground hover:bg-muted"
              >
                <UserRound className="h-3.5 w-3.5" />
                <span>{sender.name}</span>
              </button>
            ) : null
          })()}
        </div>
      )}

      <ScrollArea className="flex-1 p-3">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
            Cargando actividad...
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-red-500/70" />
            <div>
              <p className="text-sm font-medium text-red-700">Error cargando actividad</p>
              <p className="mt-1 max-w-md text-xs text-muted-foreground">{error}</p>
            </div>
            <Button size="sm" variant="outline" className="gap-1" onClick={fetchMessages}>
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </Button>
          </div>
        ) : (
          <div className="space-y-3" ref={scrollRef}>
            {messages.map((msg) => {
              const isOutgoing = msg.message_type === 1
              const isActivity = msg.message_type === 2

              if (isActivity) {
                return (
                  <Card key={msg.id} className="border-dashed">
                    <div className="flex items-start gap-3 p-3">
                      <div className="mt-0.5 rounded-full bg-muted p-2">
                        <CalendarClock className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant="outline" className="text-[11px]">
                            Evento
                          </Badge>
                          <span className="text-[11px] text-muted-foreground">
                            {msg.created_at ? formatMessageDate(msg.created_at) : ""}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-foreground whitespace-pre-wrap">
                          {msg.content}
                        </p>
                      </div>
                    </div>
                  </Card>
                )
              }

              return (
                <Card key={msg.id} className={isOutgoing ? "border-primary/20 bg-primary/5" : ""}>
                  <div className="flex items-start gap-3 p-3">
                    <div className={`mt-0.5 rounded-full p-2 ${isOutgoing ? "bg-primary/10" : "bg-muted"}`}>
                      {isOutgoing ? (
                        <ArrowUpRight className="h-4 w-4 text-primary" />
                      ) : (
                        <ArrowDownLeft className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Badge variant={isOutgoing ? "default" : "secondary"} className="text-[11px]">
                            {isOutgoing ? "Salida" : "Entrada"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {msg.sender?.name || "Sistema"}
                          </span>
                        </div>
                        <span className="text-[11px] text-muted-foreground">
                          {msg.created_at ? formatMessageDate(msg.created_at) : ""}
                        </span>
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                        {msg.content}
                      </p>
                      {isOutgoing && (
                        <div className="mt-2 flex items-center justify-end gap-1 text-[11px] text-muted-foreground">
                          <CheckCheck className="h-3 w-3" />
                          Registrado
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )}
      </ScrollArea>

      <div className="border-t p-3">
        <div className="mb-2 flex items-center gap-2 text-[11px] text-muted-foreground">
          <UserRound className="h-3 w-3" />
          <span>Acción manual o respuesta operativa</span>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Registrar respuesta o nota..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                sendMessage()
              }
            }}
            className="flex-1"
            disabled={sending}
          />
          <Button
            size="sm"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            className="shrink-0 gap-1"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
