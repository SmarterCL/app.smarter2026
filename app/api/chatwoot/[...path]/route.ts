import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createChatwootClient } from "@/lib/chatwoot-client"
import { getTenantById } from "@/lib/supabase"

/**
 * Chatwoot API Proxy
 * 
 * Este endpoint actúa como proxy autenticado hacia Chatwoot API.
 * Require autenticación via Supabase Auth.
 * 
 * Rutas soportadas:
 * - GET /api/chatwoot/inboxes
 * - GET /api/chatwoot/conversations?status=open&inboxId=1
 * - GET /api/chatwoot/conversations/:id/messages
 * - POST /api/chatwoot/conversations/:id/messages
 * - POST /api/chatwoot/conversations/:id/toggle_status
 * - GET /api/chatwoot/contacts?page=1
 * - GET /api/chatwoot/contacts/search?q=juan
 * - POST /api/chatwoot/contacts
 */

export async function GET(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Obtener pathname y query params
    const { searchParams, pathname } = new URL(request.url)
    const path = pathname.replace("/api/chatwoot", "")
    const tenantId = searchParams.get("tenant_id")

    // Crear cliente Chatwoot
    const client = createChatwootClient()
    let tenantInboxId: number | undefined
    if (tenantId) {
      try {
        const tenant = await getTenantById(tenantId)
        tenantInboxId = tenant.chatwoot_inbox_id ?? undefined
      } catch (error) {
        console.warn("Unable to resolve tenant inbox for chatwoot proxy:", error)
      }
    }

    // Routing según el path
    if (path === "/inboxes") {
      const inboxes = await client.getInboxes()
      return NextResponse.json({ success: true, data: inboxes })
    }

    if (path === "/conversations") {
      const status = searchParams.get("status") as "open" | "resolved" | "pending" | "all" | undefined
      const inboxId = searchParams.get("inboxId") || searchParams.get("inbox_id")
      const assigneeType = searchParams.get("assigneeType") as "me" | "unassigned" | "all" | undefined
      const page = searchParams.get("page")

      const conversations = await client.getConversations({
        status,
        inboxId: inboxId ? parseInt(inboxId) : tenantInboxId,
        assigneeType,
        page: page ? parseInt(page) : undefined,
      })

      return NextResponse.json({ success: true, data: conversations })
    }

    // GET /api/chatwoot/conversations/:id/messages
    const conversationMessagesMatch = path.match(/^\/conversations\/(\d+)\/messages$/)
    if (conversationMessagesMatch) {
      const conversationId = parseInt(conversationMessagesMatch[1])
      const messages = await client.getMessages(conversationId)
      return NextResponse.json({ success: true, data: messages })
    }

    // GET /api/chatwoot/contacts
    if (path === "/contacts") {
      const page = searchParams.get("page")
      const sort = searchParams.get("sort") as "name" | "email" | "phone_number" | "last_activity_at" | undefined

      const contacts = await client.getContacts({
        page: page ? parseInt(page) : undefined,
        sort,
      })

      return NextResponse.json({ success: true, data: contacts })
    }

    // GET /api/chatwoot/contacts/search?q=query
    if (path === "/contacts/search") {
      const query = searchParams.get("q")
      if (!query) {
        return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 })
      }

      const contacts = await client.searchContacts(query)
      return NextResponse.json({ success: true, data: contacts })
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 })
  } catch (error) {
    console.error("Chatwoot API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verificar autenticación
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { pathname } = new URL(request.url)
    const path = pathname.replace("/api/chatwoot", "")
    const body = await request.json()

    const client = createChatwootClient()

    // POST /api/chatwoot/conversations/:id/messages
    const sendMessageMatch = path.match(/^\/conversations\/(\d+)\/messages$/)
    if (sendMessageMatch) {
      const conversationId = parseInt(sendMessageMatch[1])
      const { content, messageType } = body

      if (!content) {
        return NextResponse.json({ error: "Content is required" }, { status: 400 })
      }

      const message = await client.sendMessage(conversationId, content, messageType)
      return NextResponse.json({ success: true, data: message })
    }

    // POST /api/chatwoot/conversations/:id/toggle_status
    const toggleStatusMatch = path.match(/^\/conversations\/(\d+)\/toggle_status$/)
    if (toggleStatusMatch) {
      const conversationId = parseInt(toggleStatusMatch[1])
      const { status } = body

      if (!status || !["open", "resolved"].includes(status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 })
      }

      const result = await client.toggleConversationStatus(conversationId, status)
      return NextResponse.json({ success: true, data: result })
    }

    // POST /api/chatwoot/contacts
    if (path === "/contacts") {
      const { name, email, phone_number, custom_attributes } = body

      if (!name) {
        return NextResponse.json({ error: "Name is required" }, { status: 400 })
      }

      const contact = await client.createContact({
        name,
        email,
        phone_number,
        custom_attributes,
      })

      return NextResponse.json({ success: true, data: contact })
    }

    // POST /api/chatwoot/conversations/:id/assignments
    const assignMatch = path.match(/^\/conversations\/(\d+)\/assignments$/)
    if (assignMatch) {
      const conversationId = parseInt(assignMatch[1])
      const { assignee_id } = body

      if (!assignee_id) {
        return NextResponse.json({ error: "assignee_id is required" }, { status: 400 })
      }

      const result = await client.assignConversation(conversationId, assignee_id)
      return NextResponse.json({ success: true, data: result })
    }

    return NextResponse.json({ error: "Not found" }, { status: 404 })
  } catch (error) {
    console.error("Chatwoot API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
