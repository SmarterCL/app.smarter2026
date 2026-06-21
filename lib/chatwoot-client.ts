/**
 * Chatwoot API Client
 * 
 * Integración con Chatwoot para obtener inboxes, conversaciones y mensajes.
 * Se conecta a chat.smarterbot.store
 */

export interface ChatwootConfig {
  baseUrl: string
  accountId: string
  accessToken: string
}

export interface ChatwootInbox {
  id: number
  name: string
  channel_type: "Channel::WebWidget" | "Channel::Api" | "Channel::WhatsApp" | "Channel::Email"
  avatar_url?: string
  webhook_url?: string
  greeting_enabled: boolean
  greeting_message?: string
  enable_auto_assignment: boolean
  allow_messages_after_resolved: boolean
}

export interface ChatwootContact {
  id: number
  name: string
  email?: string
  phone_number?: string
  avatar_url?: string
  additional_attributes?: Record<string, any>
  custom_attributes?: Record<string, any>
  last_activity_at?: number
}

export interface ChatwootMessage {
  id: number
  content: string
  message_type: 0 | 1 | 2 // 0: incoming, 1: outgoing, 2: activity
  created_at: number
  conversation_id: number
  attachments?: Array<{
    id: number
    file_type: string
    data_url: string
  }>
  sender?: {
    id: number
    name: string
    avatar_url?: string
    type: "contact" | "user"
  }
  content_attributes?: Record<string, any>
}

export interface ChatwootConversation {
  id: number
  inbox_id: number
  status: "open" | "resolved" | "pending"
  timestamp: number
  contact_last_seen_at: number
  agent_last_seen_at?: number
  unread_count: number
  additional_attributes?: Record<string, any>
  custom_attributes?: Record<string, any>
  messages: ChatwootMessage[]
  meta: {
    sender: ChatwootContact
    assignee?: {
      id: number
      name: string
      avatar_url?: string
    }
  }
}

export interface ChatwootPayload {
  success: boolean
  payload?: any
  error?: string
}

/**
 * Chatwoot API Client Class
 */
export class ChatwootClient {
  private config: ChatwootConfig

  constructor(config: ChatwootConfig) {
    this.config = config
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.config.baseUrl}/api/v1/accounts/${this.config.accountId}${endpoint}`

    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "api_access_token": this.config.accessToken,
        ...options.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text().catch(() => "")
      throw new Error(
        `Chatwoot API error: ${response.status} ${response.statusText}${errorText ? ` - ${errorText}` : ""}`
      )
    }

    return response.json()
  }

  /**
   * Get all inboxes for the account
   */
  async getInboxes(): Promise<ChatwootInbox[]> {
    const data = await this.request<{ payload: ChatwootInbox[] }>("/inboxes")
    return data.payload
  }

  /**
   * Get conversations with filters
   */
  async getConversations(params: {
    status?: "open" | "resolved" | "pending" | "all"
    inboxId?: number
    assigneeType?: "me" | "unassigned" | "all"
    page?: number
  } = {}): Promise<{
    data: { payload: ChatwootConversation[] }
    meta: { count: number; current_page: number }
  }> {
    const queryParams = new URLSearchParams()
    if (params.status) queryParams.set("status", params.status)
    if (params.inboxId) queryParams.set("inbox_id", params.inboxId.toString())
    if (params.assigneeType) queryParams.set("assignee_type", params.assigneeType)
    if (params.page) queryParams.set("page", params.page.toString())

    const endpoint = `/conversations?${queryParams.toString()}`
    return this.request(endpoint)
  }

  /**
   * Get messages for a specific conversation
   */
  async getMessages(conversationId: number): Promise<ChatwootMessage[]> {
    const data = await this.request<{ payload: ChatwootMessage[] }>(
      `/conversations/${conversationId}/messages`
    )
    return data.payload
  }

  /**
   * Send a message to a conversation
   */
  async sendMessage(
    conversationId: number,
    content: string,
    messageType: "outgoing" | "incoming" = "outgoing"
  ): Promise<ChatwootMessage> {
    const data = await this.request<{ payload: ChatwootMessage }>(
      `/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: JSON.stringify({
          content,
          message_type: messageType,
          private: false,
        }),
      }
    )
    return data.payload
  }

  /**
   * Toggle conversation status (open/resolved)
   */
  async toggleConversationStatus(
    conversationId: number,
    status: "open" | "resolved"
  ): Promise<ChatwootPayload> {
    return this.request(`/conversations/${conversationId}/toggle_status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    })
  }

  /**
   * Get contacts list
   */
  async getContacts(params: {
    page?: number
    sort?: "name" | "email" | "phone_number" | "last_activity_at"
  } = {}): Promise<{
    payload: ChatwootContact[]
    meta: { count: number; current_page: number }
  }> {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.set("page", params.page.toString())
    if (params.sort) queryParams.set("sort", params.sort)

    const endpoint = `/contacts?${queryParams.toString()}`
    return this.request(endpoint)
  }

  /**
   * Search contacts
   */
  async searchContacts(query: string): Promise<ChatwootContact[]> {
    const data = await this.request<{ payload: ChatwootContact[] }>(
      `/contacts/search?q=${encodeURIComponent(query)}`
    )
    return data.payload
  }

  /**
   * Create a new contact
   */
  async createContact(contact: {
    name: string
    email?: string
    phone_number?: string
    custom_attributes?: Record<string, any>
  }): Promise<ChatwootContact> {
    const data = await this.request<{ payload: ChatwootContact }>("/contacts", {
      method: "POST",
      body: JSON.stringify(contact),
    })
    return data.payload
  }

  /**
   * Assign conversation to agent
   */
  async assignConversation(
    conversationId: number,
    agentId: number
  ): Promise<ChatwootPayload> {
    return this.request(`/conversations/${conversationId}/assignments`, {
      method: "POST",
      body: JSON.stringify({ assignee_id: agentId }),
    })
  }
}

/**
 * Create Chatwoot client from environment variables
 */
export function createChatwootClient(): ChatwootClient {
  const baseUrl = process.env.CHATWOOT_BASE_URL || "https://chat.smarterbot.store"
  const accountId = process.env.CHATWOOT_ACCOUNT_ID || "1"
  const accessToken = process.env.CHATWOOT_ACCESS_TOKEN

  if (!accessToken) {
    throw new Error("CHATWOOT_ACCESS_TOKEN environment variable is required")
  }

  return new ChatwootClient({ baseUrl, accountId, accessToken })
}
