import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const HERMES_API_URL = process.env.HERMES_API_URL || "http://localhost:8642"
const HERMES_API_KEY = process.env.HERMES_API_KEY || ""

async function proxyToHermes(path: string, options: RequestInit = {}) {
  const url = `${HERMES_API_URL}${path}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (HERMES_API_KEY) {
    headers["Authorization"] = `Bearer ${HERMES_API_KEY}`
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  try {
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json(
      { error: "Hermes proxy error", status: response.status },
      { status: response.status }
    )
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/hermes", "")

  // Hermes health / models
  if (path === "/status" || path === "/health") {
    return proxyToHermes("/v1/models")
  }

  // Contact analysis (from Hermes/MCP pipeline data)
  // This reads from Supabase via the CRM proxy rather than Hermes directly
  // Hermes doesn't have a direct contact analysis endpoint yet
  const analysisMatch = path.match(/^\/contact\/(.+)\/analysis$/)
  if (analysisMatch) {
    // Fallback: redirect to CRM contact endpoint which includes lead_score + intent
    return proxyToHermes(`/v1/models`) // placeholder — will be expanded in Phase 2.6
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/hermes", "")
  const body = await request.json()

  // Ask Hermes a question (conversational query)
  if (path === "/ask") {
    // This will be implemented in Phase 2.6 (Hermes + Graphifyy)
    // For now, return a placeholder response
    return NextResponse.json({
      response: "Hermes está configurando su capacidad de análisis. Esta función estará disponible pronto.",
      status: "pending",
    })
  }

  // Chat with Hermes (OpenAI-compatible endpoint)
  if (path === "/chat") {
    return proxyToHermes("/v1/chat/completions", {
      method: "POST",
      body: JSON.stringify({
        model: body.model || "openrouter/auto",
        messages: body.messages || [{ role: "user", content: body.content || body.query }],
        temperature: body.temperature || 0.7,
        max_tokens: body.max_tokens || 500,
      }),
    })
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
