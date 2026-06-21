"use client"

import { useEffect, useState, useCallback } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Sparkles,
  Target,
  TrendingUp,
  Zap,
  Brain,
  Send,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react"

interface HermesPanelProps {
  conversationId: number | null
  contactId: number | null
}

interface ContactAnalysis {
  lead_score: number
  intent: string
  segment: string
  summary: string
  next_action: string
  tags: string[]
  confidence: number
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

export function HermesPanel({ conversationId, contactId }: HermesPanelProps) {
  const [analysis, setAnalysis] = useState<ContactAnalysis | null>(null)
  const [loading, setLoading] = useState(false)
  const [hermesQuery, setHermesQuery] = useState("")
  const [hermesResponse, setHermesResponse] = useState("")
  const [hermesLoading, setHermesLoading] = useState(false)
  const [hermesHistory, setHermesHistory] = useState<{ q: string; r: string }[]>([])

  const fetchAnalysis = useCallback(async () => {
    if (!contactId) return
    setLoading(true)
    try {
      const res = await fetch(`/api/crm/contacts/${contactId}`)
      const data = await readJsonSafely(res)
      if (data.success || data.id) {
        setAnalysis({
          lead_score: data.lead_score || data.score || 0,
          intent: data.intent || data.last_intent || "Sin clasificar",
          segment: data.segment || data.lead_segment || "Sin segmento",
          summary: data.summary || data.last_interaction_summary || "",
          next_action: data.next_action || data.recommended_action || "Sin recomendación",
          tags: data.tags || data.custom_attributes?.tags || [],
          confidence: data.confidence || data.intent_confidence || 0,
        })
      }
    } catch (err) {
      console.error("Failed to fetch Hermes analysis:", err)
    } finally {
      setLoading(false)
    }
  }, [contactId])

  useEffect(() => {
    fetchAnalysis()
  }, [fetchAnalysis])

  const askHermes = async () => {
    if (!hermesQuery.trim() || hermesLoading) return
    setHermesLoading(true)
    const query = hermesQuery.trim()
    setHermesQuery("")
    try {
      const res = await fetch("/api/hermes/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          context: { conversation_id: conversationId, contact_id: contactId },
        }),
      })
      const data = await readJsonSafely(res)
      const response = data.response || data.message || data.answer || "Hermes no pudo responder"
      setHermesResponse(response)
      setHermesHistory((prev) => [...prev.slice(-4), { q: query, r: response }])
    } catch (err) {
      setHermesResponse("Error de conexión con Hermes")
    } finally {
      setHermesLoading(false)
    }
  }

  const scoreColor = (score: number) => {
    if (score >= 70) return "text-emerald-600"
    if (score >= 40) return "text-yellow-600"
    return "text-red-600"
  }

  const scoreLabel = (score: number) => {
    if (score >= 70) return "Hot Lead"
    if (score >= 40) return "Warm"
    return "Cold"
  }

  const scoreProgressColor = (score: number) => {
    if (score >= 70) return "[&]:bg-emerald-500"
    if (score >= 40) return "[&]:bg-yellow-500"
    return "[&]:bg-red-500"
  }

  if (!contactId && !conversationId) {
    return (
      <div className="flex h-full items-center justify-center border-l bg-muted/30">
        <div className="flex flex-col items-center gap-4 text-center">
          <Brain className="h-8 w-8 text-muted-foreground/40" />
          <div>
            <h3 className="text-sm font-medium">Inteligencia</h3>
            <p className="text-xs text-muted-foreground">
              Selecciona un contacto para ver análisis
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col border-l">
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-semibold">Inteligencia</h2>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-3 p-3">
          {loading ? (
            <Card>
              <CardContent className="p-4 text-center">
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">Analizando contacto...</p>
              </CardContent>
            </Card>
          ) : analysis ? (
            <>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Target className="h-4 w-4" />
                    Lead Score
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`text-3xl font-bold ${scoreColor(analysis.lead_score)}`}>
                      {analysis.lead_score}
                    </span>
                    <Badge
                      className={
                        analysis.lead_score >= 70
                          ? "bg-emerald-500/10 text-emerald-700"
                          : analysis.lead_score >= 40
                          ? "bg-yellow-500/10 text-yellow-700"
                          : "bg-red-500/10 text-red-700"
                      }
                    >
                      {scoreLabel(analysis.lead_score)}
                    </Badge>
                  </div>
                  <Progress value={analysis.lead_score} className={`h-2 ${scoreProgressColor(analysis.lead_score)}`} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4" />
                    Clasificación
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Badge variant="outline" className="text-sm">
                    {analysis.intent}
                  </Badge>
                  {analysis.confidence > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      Confianza: {analysis.confidence}%
                    </div>
                  )}
                  <Badge variant="secondary" className="text-xs">
                    Segmento: {analysis.segment}
                  </Badge>
                </CardContent>
              </Card>

              {analysis.tags.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4" />
                      Tags
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-1">
                      {analysis.tags.map((tag, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {analysis.summary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <TrendingUp className="h-4 w-4" />
                      Resumen
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {analysis.summary}
                    </p>
                  </CardContent>
                </Card>
              )}

              <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm text-primary">
                    <Zap className="h-4 w-4" />
                    Próxima Acción
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-medium text-foreground">
                    {analysis.next_action}
                  </p>
                </CardContent>
              </Card>

              <Separator />
            </>
          ) : (
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-5 w-5 mx-auto text-muted-foreground" />
                <p className="mt-2 text-xs text-muted-foreground">
                  Sin datos de análisis
                </p>
              </CardContent>
            </Card>
          )}

          {hermesHistory.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Consultas recientes
              </h3>
              {hermesHistory.map((h, i) => (
                <Card key={i}>
                  <CardContent className="p-3 space-y-1">
                    <p className="text-xs font-medium text-foreground">{h.q}</p>
                    <p className="text-xs text-muted-foreground">{h.r}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t p-3">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary shrink-0" />
          <Input
            placeholder="Consulta operativa..."
            value={hermesQuery}
            onChange={(e) => setHermesQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                askHermes()
              }
            }}
            className="flex-1 h-8 text-xs"
            disabled={hermesLoading}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={askHermes}
            disabled={!hermesQuery.trim() || hermesLoading}
            className="shrink-0 h-8"
          >
            {hermesLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Send className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
