import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Base URLs for WAHA (WhatsApp Gateway)
const WAHA_BASE_URLS = [
  process.env.WAHA_INTERNAL_URL,
  process.env.WAHA_BASE_URL,
  "http://waha:3000",
  "http://host.docker.internal:3003",
  "http://localhost:3003",
].filter(Boolean) as string[]

const WAHA_API_KEY = process.env.WAHA_API_KEY || "waha-smarteros-2026-fixed-key-12345"

// Helper to make a request to WAHA with fallback URLs
async function requestWaha(endpoint: string, options: RequestInit = {}) {
  let lastError: any = null

  for (const baseUrl of WAHA_BASE_URLS) {
    try {
      const url = `${baseUrl}${endpoint}`
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": WAHA_API_KEY,
          ...(options.headers || {}),
        },
      })

      if (response.ok) {
        return { ok: true, data: await response.json().catch(() => ({})) }
      }

      const text = await response.text()
      lastError = new Error(`WAHA responded with ${response.status}: ${text}`)
    } catch (error) {
      lastError = error
    }
  }

  return { ok: false, error: lastError || new Error("All WAHA upstreams unreachable") }
}

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { rut, business_name, email, plan = "starter" } = body

    if (!rut || !business_name || !email) {
      return NextResponse.json(
        { error: "Faltan parámetros requeridos (rut, business_name, email)" },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuración de servidor de base de datos incompleta" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Normalizar RUT (eliminar puntos, guiones y espacios)
    const normalizedRut = rut.trim().toUpperCase().replace(/\./g, "").replace(/\s/g, "")
    const payerEmail = email.trim().toLowerCase()

    // 1. Verificar si el RUT ya existe
    const { data: existingTenant } = await supabase
      .from("tenants")
      .select("id, status")
      .eq("rut", normalizedRut)
      .maybeSingle()

    if (existingTenant) {
      return NextResponse.json(
        { error: "Ya existe un tenant registrado con este RUT.", code: "RUT_EXISTS" },
        { status: 409 }
      )
    }

    const tenantId = crypto.randomUUID()
    const apiKey = crypto.randomBytes(32).toString("hex")
    const rollbackStack: Array<() => Promise<void>> = []

    try {
      // ETAPA 1: Crear Workspace (registro en tenants)
      const { data: tenant, error: tenantError } = await supabase
        .from("tenants")
        .insert({
          tenant_id: tenantId,
          name: business_name.trim(),
          rut: normalizedRut,
          razon_social: business_name.trim(),
          email: payerEmail,
          nombre_completo: business_name.trim(),
          plan,
          status: "pending",
          api_key: apiKey,
          business_name: business_name.trim(),
          contact_email: payerEmail,
          auth_user_id: userId,
          created_via: "onboarding",
          services_enabled: {
            crm: true,
            bot: false,
            erp: false,
            workflows: false,
            kpi: false,
          },
          onboarding_step: 1,
        })
        .select()
        .single()

      if (tenantError || !tenant) {
        throw new Error(`Error al crear tenant en DB: ${tenantError?.message}`)
      }

      // Registro de rollback para la base de datos
      rollbackStack.push(async () => {
        await supabase.from("tenants").delete().eq("id", tenant.id)
      })

      // ETAPA 2: Vincular Propietario en tenant_members
      const { error: memberError } = await supabase
        .from("tenant_members")
        .insert({
          tenant_id: tenant.id,
          user_id: userId,
          role: "owner",
        })

      if (memberError) {
        throw new Error(`Error al registrar rol del usuario en DB: ${memberError.message}`)
      }

      // ETAPA 3: Crear Inbox de tipo API en Chatwoot
      const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || "https://chat.smarterbot.store"
      const chatwootAccountId = process.env.CHATWOOT_ACCOUNT_ID || "1"
      const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN

      let inboxId: number | null = null

      if (chatwootToken && chatwootToken !== "replace_me") {
        const chatwootWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL || "https://app.smarterbot.store"}/api/webhook/chatwoot`
        
        const chatwootRes = await fetch(
          `${chatwootBaseUrl}/api/v1/accounts/${chatwootAccountId}/inboxes`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api_access_token": chatwootToken,
            },
            body: JSON.stringify({
              name: `WABA - ${business_name.trim()}`,
              channel: {
                type: "api",
                webhook_url: chatwootWebhookUrl,
              },
            }),
          }
        )

        if (!chatwootRes.ok) {
          const errorText = await chatwootRes.text().catch(() => "")
          throw new Error(`Error al crear inbox en Chatwoot (${chatwootRes.status}): ${errorText}`)
        }

        const chatwootData = await chatwootRes.json()
        inboxId = chatwootData.id

        // Registro de rollback para eliminar el inbox en Chatwoot
        rollbackStack.push(async () => {
          await fetch(
            `${chatwootBaseUrl}/api/v1/accounts/${chatwootAccountId}/inboxes/${inboxId}`,
            {
              method: "DELETE",
              headers: {
                "api_access_token": chatwootToken,
              },
            }
          )
        })

        // Actualizar el tenant con el ID de inbox
        await supabase
          .from("tenants")
          .update({ chatwoot_inbox_id: inboxId, onboarding_step: 3, waha_session_status: 'STARTING' })
          .eq("id", tenant.id)
        // Initialize WAHA session for the tenant
        const wahaInit = await requestWaha('/sessions', {
          method: 'POST',
          body: JSON.stringify({
            name: tenantId,
            start: true,
            config: { metadata: { tenant_id: tenantId } },
          }),
        })
        if (!wahaInit.ok) {
          throw new Error(`Error creating WAHA session: ${wahaInit.error?.message || 'unknown'}`)
        }
        const { data: wahaData } = wahaInit
        const wahaSessionId = wahaData?.session_id || null
        // Update tenant with WAHA session status
        await supabase
          .from('tenants')
          .update({ waha_session_status: wahaSessionId ? 'ACTIVE' : 'FAILED' })
          .eq('id', tenant.id)
      } else {
        console.warn("Sustituyendo Chatwoot Inbox debido a credenciales faltantes")
      }

      // ETAPA 4: Aprovisionar sesión de WhatsApp en WAHA
      const wahaSessionResult = await requestWaha("/api/sessions", {
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
      })

      if (!wahaSessionResult.ok) {
        // Si falló crearla porque ya existía, intentamos iniciarla
        const wahaStartResult = await requestWaha(`/api/sessions/${tenantId}/start`, {
          method: "POST",
        })

        if (!wahaStartResult.ok) {
          throw new Error(`Error al inicializar sesión en WAHA: ${wahaSessionResult.error?.message}`)
        }
      }

      // Registro de rollback para detener la sesión de WAHA
      rollbackStack.push(async () => {
        await requestWaha(`/api/sessions/${tenantId}`, {
          method: "DELETE",
        })
      })

      // ETAPA 5: Suscribir webhook específico de sesión en WAHA (opcional)
      await requestWaha("/api/webhooks", {
        method: "POST",
        body: JSON.stringify({
          url: `${process.env.NEXT_PUBLIC_APP_URL || "https://app.smarterbot.store"}/api/webhook/waha`,
          events: ["message", "session.status"],
          sessionName: tenantId,
        }),
      })

      // Marcar onboarding como finalizado en DB
      await supabase
        .from("tenants")
        .update({
          onboarding_step: 7,
          waha_session_status: "CONNECTED",
          status: "active",
          activated_at: new Date().toISOString(),
        })
        .eq("id", tenant.id)

      return NextResponse.json(
        {
          success: true,
          tenant: {
            id: tenant.id,
            tenant_id: tenantId,
            name: tenant.name,
            chatwoot_inbox_id: inboxId,
            waha_session: tenantId,
            status: "active",
          },
        },
        { status: 201 }
      )
    } catch (innerError: any) {
      console.error("Falla en flujo transaccional de Onboarding, ejecutando rollback...", innerError)

      // Guardar el error en la tabla para diagnóstico (si el registro de tenant existe en DB)
      try {
        const { data: checkTenant } = await supabase
          .from("tenants")
          .select("id")
          .eq("tenant_id", tenantId)
          .maybeSingle()

        if (checkTenant) {
          await supabase
            .from("tenants")
            .update({
              onboarding_error: {
                message: innerError.message,
                timestamp: new Date().toISOString(),
              },
            })
            .eq("id", checkTenant.id)
        }
      } catch (dbErr) {
        console.error("No se pudo persistir el reporte de error de onboarding en DB:", dbErr)
      }

      // Ejecutar las funciones de rollback en orden inverso (de la más nueva a la más antigua)
      for (const rollbackFn of rollbackStack.reverse()) {
        try {
          await rollbackFn()
        } catch (rollbackError) {
          console.error("Falla en un paso del rollback progresivo:", rollbackError)
        }
      }

      return NextResponse.json(
        {
          error: "Error durante el aprovisionamiento automático de servicios.",
          details: innerError.message,
        },
        { status: 500 }
      )
    }
  } catch (outerError: any) {
    console.error("Onboarding endpoint error:", outerError)
    return NextResponse.json(
      { error: outerError.message || "Error interno del servidor" },
      { status: 500 }
    )
  }
}
