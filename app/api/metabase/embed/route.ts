import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { SignJWT } from "jose"

// Expected env: process.env.MB_EMBEDDING_SECRET_KEY
// Metabase embedding uses HS256 shared secret

const METABASE_SITE_URL = process.env.MB_SITE_URL || "https://kpi.smarterbot.store"
const METABASE_SECRET = process.env.MB_EMBEDDING_SECRET_KEY || ""

// Simple resource contract: body: { resource: { dashboard: number } | { question: number }, params?: Record<string,string>, expirySeconds?: number }

export async function POST(req: Request) {
  if (!METABASE_SECRET) {
    return NextResponse.json({ error: "Metabase secret no configurado" }, { status: 500 })
  }

  // Supabase auth (reject if not logged-in)
  try {
     const authObj = await auth()
     const userId = authObj.userId
    if (!userId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }
  } catch (e) {
    return NextResponse.json({ error: "Error de autenticación" }, { status: 401 })
  }

  let payload: any
  try {
    payload = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const resource = payload?.resource
  const params = payload?.params || {}
  const expirySeconds = Math.min(Math.max(payload?.expirySeconds || 300, 60), 3600) // clamp 1–60 min

  if (!resource || (typeof resource.dashboard !== "number" && typeof resource.question !== "number")) {
    return NextResponse.json({ error: "Resource inválido: requiere dashboard:number o question:number" }, { status: 400 })
  }

  // Sign JWT
  try {
    const secretKey = new TextEncoder().encode(METABASE_SECRET)
    const now = Math.floor(Date.now() / 1000)
    const exp = now + expirySeconds
    const token = await new SignJWT({ resource, params, iat: now })
      .setProtectedHeader({ alg: "HS256", typ: "JWT" })
      .setExpirationTime(exp)
      .sign(secretKey)

    const basePath = resource.dashboard
      ? `/embed/dashboard/${token}#bordered=true&titled=true`
      : `/embed/question/${token}#bordered=true&titled=true`
    const iframeUrl = `${METABASE_SITE_URL}${basePath}`

    return NextResponse.json({ token, iframeUrl, expiresAt: exp })
  } catch (e: any) {
    return NextResponse.json({ error: "Error al firmar token", detail: e?.message }, { status: 500 })
  }
}
