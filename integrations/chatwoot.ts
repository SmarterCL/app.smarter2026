/**
 * Chatwoot Integration — Inbox Unificado
 * 
 * Crea conversaciones, envía mensajes, gestiona contactos
 * Conecta con WhatsApp, Telegram, Web
 * 
 * Setup:
 * 1. Instalar Chatwoot en VPS
 * 2. Crear inbox de WhatsApp/Telegram
 * 3. Obtener access token
 */

import { z } from 'zod'

const chatwootContactSchema = z.object({
  inbox_id: z.number(),
  name: z.string(),
  phone_number: z.string(),
  email: z.string().optional(),
  avatar_url: z.string().optional()
})

const chatwootMessageSchema = z.object({
  inbox_id: z.number(),
  contact_id: z.number().optional(),
  conversation_id: z.number().optional(),
  content: z.string(),
  message_type: z.enum(['incoming', 'outgoing', 'template']),
  private: z.boolean().optional()
})

export interface ChatwootContact {
  inbox_id: number
  name: string
  phone_number: string
  email?: string
  avatar_url?: string
}

export interface ChatwootMessage {
  inbox_id: number
  contact_id?: number
  conversation_id?: number
  content: string
  message_type: 'incoming' | 'outgoing' | 'template'
  private?: boolean
}

/**
 * Crear contacto en Chatwoot
 */
export async function createChatwootContact(
  contact: ChatwootContact
): Promise<{ success: boolean; contact_id?: number; error?: string }> {
  try {
    const validated = chatwootContactSchema.parse(contact)

    const baseUrl = process.env.CHATWOOT_BASE_URL || 'https://chat.smarterbot.store'
    const accountId = process.env.CHATWOOT_ACCOUNT_ID || '1'
    const token = process.env.CHATWOOT_ACCESS_TOKEN

    if (!token) {
      return {
        success: false,
        error: 'Chatwoot access token not configured'
      }
    }

    // Buscar contacto existente por teléfono
    const searchResponse = await fetch(
      `${baseUrl}/api/v1/accounts/${accountId}/contacts/search?q=${validated.phone_number}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const existing = await searchResponse.json()

    if (existing.length > 0) {
      return {
        success: true,
        contact_id: existing[0].id
      }
    }

    // Crear nuevo contacto
    const createResponse = await fetch(
      `${baseUrl}/api/v1/accounts/${accountId}/contacts`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inbox_id: validated.inbox_id,
          name: validated.name,
          phone_number: validated.phone_number,
          email: validated.email,
          avatar_url: validated.avatar_url
        })
      }
    )

    const data = await createResponse.json()

    if (!createResponse.ok) {
      return {
        success: false,
        error: data.message || 'Error creating contact'
      }
    }

    return {
      success: true,
      contact_id: data.id
    }

  } catch (error) {
    console.error('Error creating Chatwoot contact:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Crear conversación en Chatwoot
 */
export async function createChatwootConversation(
  inbox_id: number,
  contact_id: number,
  message?: string
): Promise<{ success: boolean; conversation_id?: number; error?: string }> {
  try {
    const baseUrl = process.env.CHATWOOT_BASE_URL || 'https://chat.smarterbot.store'
    const accountId = process.env.CHATWOOT_ACCOUNT_ID || '1'
    const token = process.env.CHATWOOT_ACCESS_TOKEN

    if (!token) {
      return {
        success: false,
        error: 'Chatwoot access token not configured'
      }
    }

    const body: any = {
      inbox_id,
      contact_id
    }

    if (message) {
      body.messages = [{ content: message, message_type: 'outgoing' }]
    }

    const response = await fetch(
      `${baseUrl}/api/v1/accounts/${accountId}/conversations`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Error creating conversation'
      }
    }

    return {
      success: true,
      conversation_id: data.id
    }

  } catch (error) {
    console.error('Error creating conversation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Enviar mensaje en conversación existente
 */
export async function sendChatwootMessage(
  conversation_id: number,
  content: string,
  messageType: 'outgoing' | 'template' = 'outgoing'
): Promise<{ success: boolean; message_id?: number; error?: string }> {
  try {
    const baseUrl = process.env.CHATWOOT_BASE_URL || 'https://chat.smarterbot.store'
    const accountId = process.env.CHATWOOT_ACCOUNT_ID || '1'
    const token = process.env.CHATWOOT_ACCESS_TOKEN

    if (!token) {
      return {
        success: false,
        error: 'Chatwoot access token not configured'
      }
    }

    const response = await fetch(
      `${baseUrl}/api/v1/accounts/${accountId}/conversations/${conversation_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content,
          message_type: messageType
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: data.message || 'Error sending message'
      }
    }

    return {
      success: true,
      message_id: data.id
    }

  } catch (error) {
    console.error('Error sending message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Flujo completo: Crear contacto + conversación + enviar mensaje
 */
export async function sendChatwootMessageToPhone(
  phone: string,
  name: string,
  message: string,
  inbox_id: number = 1
): Promise<{ success: boolean; conversation_id?: number; error?: string }> {
  try {
    // 1. Crear/buscar contacto
    const contactResult = await createChatwootContact({
      inbox_id,
      name,
      phone_number: phone
    })

    if (!contactResult.success || !contactResult.contact_id) {
      return contactResult
    }

    // 2. Crear conversación con mensaje
    const conversationResult = await createChatwootConversation(
      inbox_id,
      contactResult.contact_id,
      message
    )

    return conversationResult

  } catch (error) {
    console.error('Error in sendChatwootMessageToPhone:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Webhook handler para Chatwoot
 * Procesa eventos: conversation_created, message_created, etc.
 */
export async function processChatwootWebhook(
  body: any
): Promise<{ success: boolean; event?: string; data?: any; error?: string }> {
  try {
    const { event, conversation, message } = body

    console.log(`Chatwoot webhook received: ${event}`)

    switch (event) {
      case 'conversation_created':
        // Nueva conversación creada
        return {
          success: true,
          event,
          data: conversation
        }

      case 'message_created':
        // Nuevo mensaje recibido
        return {
          success: true,
          event,
          data: message
        }

      case 'conversation_status_changed':
        // Conversación cerrada/abierta
        return {
          success: true,
          event,
          data: conversation
        }

      default:
        return {
          success: true,
          event,
          data: body
        }
    }

  } catch (error) {
    console.error('Error processing Chatwoot webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid webhook'
    }
  }
}
