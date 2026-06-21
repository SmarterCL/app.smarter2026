import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { listTenantsForUser } from "@/lib/supabase"

const SMARTER_API_BASE_URLS = [
  process.env.SMARTER_API_URL,
  process.env.SMARTER_API_INTERNAL_URL,
  "http://host.docker.internal:8090",
  "http://172.22.0.1:8090",
  "http://localhost:8090",
].filter(Boolean) as string[]
const WAHA_BASE_URLS = [
  process.env.WAHA_INTERNAL_URL,
  process.env.WAHA_BASE_URL,
  "http://waha:3000",
  "http://host.docker.internal:3003",
  "http://localhost:3003",
].filter(Boolean) as string[]
const SERVICE_API_KEY = process.env.SERVICE_API_KEY || ""
const WAHA_API_KEY = process.env.WAHA_API_KEY || process.env.WAHA_API_KEY_PLAIN || "waha-smarteros-2026-fixed-key-12345"

async function parseResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") || ""
  return contentType.includes("application/json")
    ? response.json()
    : { ok: response.ok, status: response.status, text: await response.text() }
}

async function proxyWithFallback(paths: string[], options: RequestInit = {}) {
  let lastResponse: Response | null = null
  let lastPayload: unknown = null

  for (const baseUrl of SMARTER_API_BASE_URLS) {
    for (const path of paths) {
      const url = `${baseUrl}/api/v1${path}`
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(options.headers as Record<string, string>),
      }
      if (SERVICE_API_KEY) {
        headers["X-Service-Key"] = SERVICE_API_KEY
      }

      try {
        const response = await fetch(url, {
          ...options,
          headers,
        })

        lastResponse = response
        lastPayload = await parseResponsePayload(response)

        if (response.ok) {
          return NextResponse.json(lastPayload, { status: response.status })
        }
      } catch (error) {
        lastPayload = {
          error: "WAHA upstream unreachable",
          baseUrl,
          path,
          message: error instanceof Error ? error.message : String(error),
        }
      }
    }
  }

  return NextResponse.json(lastPayload ?? { error: "WAHA upstream error" }, {
    status: lastResponse?.status ?? 502,
  })
}

async function proxyWahaDirect(paths: string[], options: RequestInit = {}) {
  let lastResponse: Response | null = null
  let lastPayload: unknown = null

  for (const baseUrl of WAHA_BASE_URLS) {
    for (const path of paths) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          ...options,
          headers: {
            "Content-Type": "application/json",
            "X-Api-Key": WAHA_API_KEY,
            ...(options.headers as Record<string, string>),
          },
        })

        lastResponse = response
        lastPayload = await parseResponsePayload(response)

        if (response.ok) {
          return NextResponse.json({ success: true, source: "waha", data: lastPayload }, { status: response.status })
        }
      } catch (error) {
        lastPayload = {
          error: "WAHA direct upstream unreachable",
          baseUrl,
          path,
          message: error instanceof Error ? error.message : String(error),
        }
      }
    }
  }

  return NextResponse.json(lastPayload ?? { error: "WAHA direct upstream error" }, {
    status: lastResponse?.status ?? 502,
  })
}

async function fetchWahaDirect(path: string, options: RequestInit = {}) {
  let lastResponse: Response | null = null
  let lastError: unknown = null

  for (const baseUrl of WAHA_BASE_URLS) {
    try {
      const response = await fetch(`${baseUrl}${path}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": WAHA_API_KEY,
          ...(options.headers as Record<string, string>),
        },
      })
      lastResponse = response
      if (response.ok) return response
    } catch (error) {
      lastError = error
    }
  }

  if (lastResponse) return lastResponse
  throw lastError instanceof Error ? lastError : new Error("WAHA direct upstream unreachable")
}

function normalizeSessionStatus(payload: any, tenantId: string) {
  const sessions = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : null
  const session = sessions
    ? sessions.find((item: any) => item?.name === tenantId || item?.id === tenantId || item?.session === tenantId)
    : payload?.data || payload

  if (!session || session?.statusCode === 404) {
    return { status: "STOPPED", session: null }
  }

  return {
    status: session.status || session.state || "unknown",
    session,
  }
}

async function resolveTenantId(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) return null

  const { searchParams } = new URL(request.url)
  const explicitTenantId =
    searchParams.get("tenant_id") ||
    searchParams.get("tenantId") ||
    searchParams.get("session") ||
    searchParams.get("session_name")

  if (explicitTenantId) return explicitTenantId

  const tenants = await listTenantsForUser(userId)
  const primaryTenant = tenants[0] as { id?: string; tenant_id?: string } | undefined
  return primaryTenant?.id || primaryTenant?.tenant_id || null
}

function buildSessionBody(sessionId: string) {
  return {
    tenant_id: sessionId,
    session: sessionId,
    session_name: sessionId,
    sessionName: sessionId,
    name: sessionId,
  }
}

export async function GET(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/waha", "")
  const tenantId = await resolveTenantId(request)

  if (!tenantId) {
    return NextResponse.json(
      { error: "No tenant available for this user" },
      { status: 404 }
    )
  }

  // WAHA status
  if (path === "/status") {
    const direct = await proxyWahaDirect([
      `/api/sessions/${tenantId}`,
      "/api/sessions",
    ])
    if (direct.ok) {
      const payload = await direct.json()
      return NextResponse.json({
        success: true,
        source: "waha",
        data: normalizeSessionStatus(payload.data, tenantId),
      })
    }

    return proxyWithFallback([
      `/session/status/${tenantId}`,
      `/session/${tenantId}/status`,
      `/session/status`,
    ])
  }

  // WAHA QR
  if (path === "/qr") {
    return NextResponse.json({
      success: true,
      source: "waha",
      data: {
        qr_image_url: `/api/waha/qr-image?tenant_id=${encodeURIComponent(tenantId)}`,
      },
    })
  }

  if (path === "/qr-image") {
    try {
      const response = await fetchWahaDirect(`/api/${tenantId}/auth/qr`, {
        headers: { Accept: "image/png,image/svg+xml,image/*,*/*" },
      })

      if (!response.ok) {
        const payload = await parseResponsePayload(response)
        return NextResponse.json(payload, { status: response.status })
      }

      const contentType = response.headers.get("content-type") || "image/png"
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": contentType,
          "Cache-Control": "no-store",
        },
      })
    } catch (error) {
      return NextResponse.json(
        {
          error: "WAHA QR image upstream unreachable",
          message: error instanceof Error ? error.message : String(error),
        },
        { status: 502 }
      )
    }

  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}

export async function POST(request: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { pathname } = new URL(request.url)
  const path = pathname.replace("/api/waha", "")
  const tenantId = await resolveTenantId(request)

  if (!tenantId) {
    return NextResponse.json(
      { error: "No tenant available for this user" },
      { status: 404 }
    )
  }

  // Create session
  if (path === "/create") {
    const direct = await proxyWahaDirect(
      ["/api/sessions"],
      {
        method: "POST",
        body: JSON.stringify({
          name: tenantId,
          start: true,
          config: {
            metadata: {
              tenant_id: tenantId,
            },
          },
        }),
      }
    )
    if (direct.ok) return direct

    const startExisting = await proxyWahaDirect(
      [`/api/sessions/${tenantId}/start`],
      { method: "POST" }
    )
    if (startExisting.ok) return startExisting

    return proxyWithFallback(
      ["/session/create", `/session/${tenantId}/create`],
      {
        method: "POST",
        body: JSON.stringify(buildSessionBody(tenantId)),
      }
    )
  }

  // Reconnect session
  if (path === "/reconnect") {
    const direct = await proxyWahaDirect(
      [`/api/sessions/${tenantId}/start`],
      { method: "POST" }
    )
    if (direct.ok) return direct

    return proxyWithFallback(
      [`/session/reconnect/${tenantId}`, `/session/${tenantId}/reconnect`, "/session/reconnect"],
      {
        method: "POST",
        body: JSON.stringify(buildSessionBody(tenantId)),
      }
    )
  }

  // Disconnect session
  if (path === "/disconnect") {
    const direct = await proxyWahaDirect(
      [`/api/sessions/${tenantId}/stop`],
      { method: "POST" }
    )
    if (direct.ok) return direct

    return proxyWithFallback(
      [`/session/disconnect/${tenantId}`, `/session/${tenantId}/disconnect`, "/session/disconnect"],
      {
        method: "POST",
        body: JSON.stringify(buildSessionBody(tenantId)),
      }
    )
  }

  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
