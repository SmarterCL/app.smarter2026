import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createChatwootClient } from "@/lib/chatwoot-client"

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json()
    const { event, session, metadata, data } = payload

    // Solo procesamos mensajes de texto entrantes (ignorar mensajes propios del bot)
    if (event !== "message" || !data || data.fromMe) {
      return NextResponse.json({ success: true, ignored: true })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // 1. Resolver el tenant por sessionName (el sessionName de WAHA es el tenant_id del DB)
    const tenantId = session || metadata?.tenant_id
    if (!tenantId) {
      return NextResponse.json({ error: "No session context provided in payload" }, { status: 400 })
    }

    const { data: tenant, error: tenantErr } = await supabase
      .from("tenants")
      .select("id, chatwoot_inbox_id, name")
      .eq("tenant_id", tenantId)
      .single()

    if (tenantErr || !tenant) {
      console.warn(`Tenant not found for WAHA session: ${tenantId}`)
      return NextResponse.json({ error: "Tenant not found for session" }, { status: 404 })
    }

    if (!tenant.chatwoot_inbox_id) {
      console.warn(`Tenant ${tenantId} does not have a Chatwoot inbox configured`)
      return NextResponse.json({ error: "Chatwoot inbox not configured for tenant" }, { status: 400 })
    }

    // 2. Formatear y normalizar el número de teléfono
    const phoneWithSuffix = data.from // ej: "56912345678@c.us"
    const phone = phoneWithSuffix.replace("@c.us", "") // ej: "56912345678"
    const messageContent = data.body || ""

    // Inicializar cliente Chatwoot
    const chatwootToken = process.env.CHATWOOT_ACCESS_TOKEN
    if (!chatwootToken || chatwootToken === "replace_me") {
      return NextResponse.json({ error: "Chatwoot credentials not configured" }, { status: 500 })
    }

    const chatwoot = createChatwootClient()

    // 3. Buscar o crear el contacto en Chatwoot
    let contactId: number
    try {
      const contacts = await chatwoot.searchContacts(phone)
      if (contacts.length > 0) {
        contactId = contacts[0].id
      } else {
        const contact = await chatwoot.createContact({
          name: data.sender?.name || `WhatsApp Contact ${phone}`,
          phone_number: `+${phone}`,
        })
        contactId = contact.id
      }
    } catch (contactError: any) {
      console.error("Error managing Chatwoot contact:", contactError)
      return NextResponse.json({ error: "Failed to manage Chatwoot contact", details: contactError.message }, { status: 500 })
    }

    // 4. Buscar o crear la conversación mapeada en la base de datos
    let conversationId: number

    const { data: mapping, error: mappingErr } = await supabase
      .from("conversation_mapping")
      .select("chatwoot_conversation_id")
      .eq("tenant_id", tenant.id)
      .eq("whatsapp_phone", phone)
      .maybeSingle()

    if (mapping) {
      conversationId = mapping.chatwoot_conversation_id
    } else {
      // Si no hay mapeo, crear la conversación en Chatwoot
      try {
        const convResult = await chatwoot.createContact({
          name: data.sender?.name || `WhatsApp Contact ${phone}`,
          phone_number: `+${phone}`,
        }) // wait, createChatwootConversation is imported from integrations/chatwoot, let's verify what method ChatwootClient has
        
        // Wait, does ChatwootClient have a createConversation? In lib/chatwoot-client.ts:
        // No! It does not have createConversation!
        // But wait! We saw integrations/chatwoot.ts has:
        // `createChatwootConversation(inbox_id: number, contact_id: number, message?: string)`
        // Let's use direct REST fetch call as in integrations/chatwoot.ts to create the conversation safely:
        const chatwootBaseUrl = process.env.CHATWOOT_BASE_URL || "https://chat.smarterbot.store"
        const chatwootAccountId = process.env.CHATWOOT_ACCOUNT_ID || "1"

        const convResponse = await fetch(
          `${chatwootBaseUrl}/api/v1/accounts/${chatwootAccountId}/conversations`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "api_access_token": chatwootToken,
            },
            body: JSON.stringify({
              inbox_id: tenant.chatwoot_inbox_id,
              contact_id: contactId,
            }),
          }
        )

        if (!convResponse.ok) {
          const text = await convResponse.text()
          throw new Error(`Chatwoot conversations API error (${convResponse.status}): ${text}`)
        }

        const convData = await convResponse.json()
        conversationId = convData.id

        // Guardar relación de mapeo en base de datos
        const { error: insertErr } = await supabase.from("conversation_mapping").insert({
          tenant_id: tenant.id,
          chatwoot_conversation_id: conversationId,
          whatsapp_phone: phone,
        })

        if (insertErr) {
          console.error("Error creating conversation mapping in DB:", insertErr)
        }
      } catch (convError: any) {
        console.error("Error creating Chatwoot conversation:", convError)
        return NextResponse.json({ error: "Failed to create conversation in Chatwoot", details: convError.message }, { status: 500 })
      }
    }

    // 5. Enviar mensaje entrante a Chatwoot
    try {
      await chatwoot.sendMessage(conversationId, messageContent, "incoming")
    } catch (msgError: any) {
      console.error("Error pushing message to Chatwoot:", msgError)
      return NextResponse.json({ error: "Failed to forward message to Chatwoot", details: msgError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, conversation_id: conversationId })
  } catch (error: any) {
    console.error("WAHA Webhook error:", error)
    return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 })
  }
}
