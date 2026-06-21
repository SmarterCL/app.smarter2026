import crypto from "crypto"
import { createClient } from "@supabase/supabase-js"

const CODE_TTL_MINUTES = 10
const WAHA_API_KEY = process.env.WAHA_API_KEY || process.env.WAHA_API_KEY_PLAIN || ""
const WAHA_SESSION = process.env.WAHA_VERIFICATION_SESSION || process.env.WAHA_SESSION || "default"

const WAHA_BASE_URLS = [
  process.env.WAHA_INTERNAL_URL,
  process.env.WAHA_BASE_URL,
  "http://waha:3000",
  "http://host.docker.internal:3003",
  "http://localhost:3003",
].filter(Boolean) as string[]

export function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, "")
  if (!digits) return ""
  if (digits.startsWith("56")) return digits
  if (digits.startsWith("9") && digits.length === 9) return `56${digits}`
  return digits
}

function hashCode(code: string) {
  return crypto.createHash("sha256").update(code).digest("hex")
}

function generateCode() {
  return crypto.randomInt(100000, 999999).toString()
}

export async function createPhoneVerification(input: {
  supabaseUrl: string
  serviceRoleKey: string
  tenantId: string
  phone: string
  businessName: string
}) {
  const phone = normalizePhone(input.phone)
  if (!phone) {
    return { ok: false, error: "Teléfono inválido" }
  }

  const code = generateCode()
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60 * 1000).toISOString()
  const supabase = createClient(input.supabaseUrl, input.serviceRoleKey)

  const { error } = await supabase.from("phone_verifications").insert({
    tenant_id: input.tenantId,
    phone,
    code_hash: hashCode(code),
    expires_at: expiresAt,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  const message = `Tu código SmarterOS para ${input.businessName} es ${code}. Expira en ${CODE_TTL_MINUTES} minutos.`
  const sent = await sendWahaText(phone, message)
  return { ok: sent.ok, phone, expires_at: expiresAt, error: sent.error }
}

export async function verifyPhoneCode(input: {
  supabaseUrl: string
  serviceRoleKey: string
  tenantId: string
  code: string
}) {
  const supabase = createClient(input.supabaseUrl, input.serviceRoleKey)
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("phone_verifications")
    .select("id, code_hash, attempts, expires_at, verified_at")
    .eq("tenant_id", input.tenantId)
    .is("verified_at", null)
    .gt("expires_at", now)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !data) {
    return { ok: false, error: "Código inválido o expirado" }
  }

  if (data.attempts >= 5) {
    return { ok: false, error: "Demasiados intentos. Solicita un nuevo código." }
  }

  const matches = data.code_hash === hashCode(input.code.trim())
  if (!matches) {
    await supabase
      .from("phone_verifications")
      .update({ attempts: data.attempts + 1 })
      .eq("id", data.id)
    return { ok: false, error: "Código incorrecto" }
  }

  const verifiedAt = new Date().toISOString()
  await supabase.from("phone_verifications").update({ verified_at: verifiedAt }).eq("id", data.id)
  await supabase
    .from("tenants")
    .update({
      phone_verified_at: verifiedAt,
      verification_status: "phone_verified",
    })
    .eq("tenant_id", input.tenantId)

  return { ok: true }
}

async function sendWahaText(phone: string, text: string) {
  if (!WAHA_API_KEY) {
    return { ok: false, error: "WAHA_API_KEY no configurado" }
  }

  const chatId = `${phone}@c.us`
  const bodies = [
    { session: WAHA_SESSION, chatId, text },
    { session: WAHA_SESSION, chat_id: chatId, text },
    { session: WAHA_SESSION, phone, text },
  ]
  const paths = ["/api/sendText", `/api/${WAHA_SESSION}/sendText`]

  let lastError = "WAHA no disponible"
  for (const baseUrl of WAHA_BASE_URLS) {
    for (const path of paths) {
      for (const body of bodies) {
        try {
          const response = await fetch(`${baseUrl}${path}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Api-Key": WAHA_API_KEY,
            },
            body: JSON.stringify(body),
          })

          if (response.ok) return { ok: true }
          lastError = await response.text()
        } catch (error) {
          lastError = error instanceof Error ? error.message : String(error)
        }
      }
    }
  }

  return { ok: false, error: lastError }
}
