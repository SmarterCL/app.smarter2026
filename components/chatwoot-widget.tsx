"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  MessageSquare,
  Mail,
  Phone,
  Send,
  CheckCircle,
  Clock,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
} from "lucide-react"

import type {
  ChatwootInbox,
  ChatwootConversation,
  ChatwootMessage,
  ChatwootContact,
} from "@/lib/chatwoot-client"

interface ChatwootWidgetProps {
  className?: string
}

export default function ChatwootWidget({ className }: ChatwootWidgetProps) {
  const [inboxes, setInboxes] = useState<ChatwootInbox[]>([])
  const [conversations, setConversations] = useState<ChatwootConversation[]>([])
  const [selectedConversation, setSelectedConversation] = useState<ChatwootConversation | null>(null)
  const [messages, setMessages] = useState<ChatwootMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingMessages, setIsLoadingMessages] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedInbox, setSelectedInbox] = useState<number | null>(null)
  const [statusFilter, setStatusFilter] = useState<"open" | "resolved" | "pending" | "all">("open")
  const [searchQuery, setSearchQuery] = useState("")
  const [messageInput, setMessageInput] = useState("")
  const [isSending, setIsSending] = useState(false)

  // Fetch inboxes on mount
  useEffect(() => {
    fetchInboxes()
  }, [])

  // Fetch conversations when inbox or status changes
  useEffect(() => {
    if (inboxes.length > 0) {
      fetchConversations()
    }
  }, [selectedInbox, statusFilter, inboxes])

  const fetchInboxes = async () => {
    try {
      setIsLoading(true)
      const response = await fetch("/api/chatwoot/inboxes")
      const data = await response.json()

      if (data.success) {
        setInboxes(data.data)
        setError(null)
      } else {
        setError(data.error || "Error al cargar inboxes")
      }
    } catch (err) {
      console.error("Error fetching inboxes:", err)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchConversations = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        status: statusFilter,
      })

      if (selectedInbox) {
        params.set("inboxId", selectedInbox.toString())
      }

      const response = await fetch(`/api/chatwoot/conversations?${params.toString()}`)
      const data = await response.json()

      if (data.success) {
        setConversations(data.data.data.payload)
        setError(null)
      } else {
        setError(data.error || "Error al cargar conversaciones")
      }
    } catch (err) {
      console.error("Error fetching conversations:", err)
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMessages = async (conversationId: number) => {
    try {
      setIsLoadingMessages(true)
      const response = await fetch(`/api/chatwoot/conversations/${conversationId}/messages`)
      const data = await response.json()

      if (data.success) {
        setMessages(data.data)
        setError(null)
      } else {
        setError(data.error || "Error al cargar mensajes")
      }
    } catch (err) {
      console.error("Error fetching messages:", err)
      setError("Error de conexión")
    } finally {
      setIsLoadingMessages(false)
    }
  }

  const sendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation) return

    try {
      setIsSending(true)
      const response = await fetch(`/api/chatwoot/conversations/${selectedConversation.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: messageInput,
          messageType: "outgoing",
        }),
      })

      const data = await response.json()

      if (data.success) {
        setMessages((prev) => [...prev, data.data])
        setMessageInput("")
      } else {
        setError(data.error || "Error al enviar mensaje")
      }
    } catch (err) {
      console.error("Error sending message:", err)
      setError("Error al enviar mensaje")
    } finally {
      setIsSending(false)
    }
  }

  const getInboxIcon = (channelType: string) => {
    switch (channelType) {
      case "Channel::WhatsApp":
        return <Phone className="h-4 w-4" />
      case "Channel::Email":
        return <Mail className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      open: { variant: "default" as const, icon: <AlertCircle className="h-3 w-3 mr-1" /> },
      resolved: { variant: "secondary" as const, icon: <CheckCircle className="h-3 w-3 mr-1" /> },
      pending: { variant: "outline" as const, icon: <Clock className="h-3 w-3 mr-1" /> },
    }

    const config = variants[status as keyof typeof variants] || variants.open

    return (
      <Badge variant={config.variant} className="flex items-center">
        {config.icon}
        {status}
      </Badge>
    )
  }

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`
    return date.toLocaleDateString("es-CL")
  }

  const filteredConversations = conversations.filter((conv) => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      conv.meta.sender.name?.toLowerCase().includes(query) ||
      conv.meta.sender.email?.toLowerCase().includes(query)
    )
  })

  if (isLoading && inboxes.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Mensajería
              </CardTitle>
              <CardDescription>Gestiona conversaciones desde todos tus canales</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchConversations} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 text-destructive text-sm rounded-md">
              {error}
            </div>
          )}

          <Tabs defaultValue="conversations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="conversations">Conversaciones</TabsTrigger>
              <TabsTrigger value="inboxes">Inboxes</TabsTrigger>
            </TabsList>

            <TabsContent value="conversations" className="space-y-4">
              {/* Filters */}
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre o email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">Todas</option>
                  <option value="open">Abiertas</option>
                  <option value="pending">Pendientes</option>
                  <option value="resolved">Resueltas</option>
                </select>
              </div>

              {/* Conversations List */}
              <ScrollArea className="h-[400px] pr-4">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay conversaciones
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredConversations.map((conv) => (
                      <button
                        key={conv.id}
                        onClick={() => {
                          setSelectedConversation(conv)
                          fetchMessages(conv.id)
                        }}
                        className="w-full text-left p-3 rounded-lg border hover:bg-accent transition-colors"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={conv.meta.sender.avatar_url} />
                            <AvatarFallback>
                              {conv.meta.sender.name?.[0]?.toUpperCase() || "?"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-medium truncate">{conv.meta.sender.name}</p>
                              <span className="text-xs text-muted-foreground">
                                {formatTimestamp(conv.timestamp)}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              {getStatusBadge(conv.status)}
                              {conv.unread_count > 0 && (
                                <Badge variant="destructive" className="text-xs">
                                  {conv.unread_count}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="inboxes" className="space-y-4">
              <ScrollArea className="h-[400px] pr-4">
                {inboxes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No hay inboxes configurados
                  </div>
                ) : (
                  <div className="space-y-2">
                    {inboxes.map((inbox) => (
                      <button
                        key={inbox.id}
                        onClick={() => setSelectedInbox(inbox.id === selectedInbox ? null : inbox.id)}
                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                          selectedInbox === inbox.id
                            ? "bg-accent border-primary"
                            : "hover:bg-accent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {getInboxIcon(inbox.channel_type)}
                          <div>
                            <p className="font-medium">{inbox.name}</p>
                            <p className="text-sm text-muted-foreground">{inbox.channel_type}</p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Conversation Dialog */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={selectedConversation?.meta.sender.avatar_url} />
                <AvatarFallback>
                  {selectedConversation?.meta.sender.name?.[0]?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div>
                <p>{selectedConversation?.meta.sender.name}</p>
                <p className="text-sm text-muted-foreground font-normal">
                  {selectedConversation?.meta.sender.email ||
                    selectedConversation?.meta.sender.phone_number}
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="h-[400px] pr-4">
            {isLoadingMessages ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${
                      msg.message_type === 1 ? "flex-row-reverse" : "flex-row"
                    }`}
                  >
                    {msg.sender && (
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={msg.sender.avatar_url} />
                        <AvatarFallback>{msg.sender.name[0]?.toUpperCase() || "?"}</AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[70%] p-3 rounded-lg ${
                        msg.message_type === 1
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {formatTimestamp(msg.created_at)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="flex gap-2 mt-4">
            <Input
              placeholder="Escribe un mensaje..."
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
            />
            <Button onClick={sendMessage} disabled={isSending || !messageInput.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
