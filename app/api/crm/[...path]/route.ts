import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"

const SMARTER_API_URL = process.env.SMARTER_API_URL || "http://localhost:8090"
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || ""

async function proxyToSmarterApi(path: string, options: RequestInit = {}) {
  const url = `${SMARTER_API_URL}/api/v1/crm${path}`
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  }
  if (SERVICE_API_KEY) {
    headers["X-Service-Key"] = SERVICE_API_KEY
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })

  try {
    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch {
    return NextResponse.json({ error: "Proxy error", status: response.status }, { status: response.status })
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname, searchParams } = new URL(request.url)
  const path = pathname.replace("/api/crm", "")

  // CRM stats
  if (path === "/stats") {
    return proxyToSmarterApi("/stats")
  }

  // CRM contacts list
  if (path === "/contacts") {
    const qs = searchParams.toString()
    return proxyToSmarterApi(`/contacts${qs ? `?${qs}` : ""}`)
  }

  // CRM contacts by ID
  const contactMatch = path.match(/^\/contacts\/(.+)$/)
  if (contactMatch) {
    return proxyToSmarterApi(`/contacts/${contactMatch[1]}`)
  }

  // CRM contacts by phone
  const phoneMatch = path.match(/^\/contacts\/phone\/(.+)$/)
  if (phoneMatch) {
    return proxyToSmarterApi(`/contacts/phone/${phoneMatch[1]}`)
  }

  // CRM leads
  if (path === "/leads") {
    const qs = searchParams.toString()
    return proxyToSmarterApi(`/leads${qs ? `?${qs}` : ""}`)
  }

  // CRM leads by ID
  const leadMatch = path.match(/^\/leads\/(.+)$/)
  if (leadMatch) {
    return proxyToSmarterApi(`/leads/${leadMatch[1]}`)
  }

  // CRM deals
  if (path === "/deals") {
    const qs = searchParams.toString()
    return proxyToSmarterApi(`/deals${qs ? `?${qs}` : ""}`)
  }

  // CRM activities
  if (path === "/activities") {
    const qs = searchParams.toString()
    return proxyToSmarterApi(`/activities${qs ? `?${qs}` : ""}`)
  }

  // CRM events
  if (path === "/events") {
    const qs = searchParams.toString()
    return proxyToSmarterApi(`/events${qs ? `?${qs}` : ""}`)
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/crm", "")
  const body = await request.json()

  // Create contact
  if (path === "/contacts") {
    return proxyToSmarterApi("/contacts", { method: "POST", body: JSON.stringify(body) })
  }

  // Create lead
  if (path === "/leads") {
    return proxyToSmarterApi("/leads", { method: "POST", body: JSON.stringify(body) })
  }

  // Score lead
  const scoreMatch = path.match(/^\/leads\/(.+)\/score$/)
  if (scoreMatch) {
    return proxyToSmarterApi(`/leads/${scoreMatch[1]}/score`, { method: "POST", body: JSON.stringify(body) })
  }

  // Create deal
  if (path === "/deals") {
    return proxyToSmarterApi("/deals", { method: "POST", body: JSON.stringify(body) })
  }

  // Create activity
  if (path === "/activities") {
    return proxyToSmarterApi("/activities", { method: "POST", body: JSON.stringify(body) })
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function PATCH(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/crm", "")
  const body = await request.json()

  // Update contact
  const contactMatch = path.match(/^\/contacts\/(.+)$/)
  if (contactMatch) {
    return proxyToSmarterApi(`/contacts/${contactMatch[1]}`, { method: "PATCH", body: JSON.stringify(body) })
  }

  // Update lead
  const leadMatch = path.match(/^\/leads\/(.+)$/)
  if (leadMatch) {
    return proxyToSmarterApi(`/leads/${leadMatch[1]}`, { method: "PATCH", body: JSON.stringify(body) })
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
