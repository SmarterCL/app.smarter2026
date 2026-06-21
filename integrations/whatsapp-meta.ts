/**
 * Meta Developer Integration — WhatsApp Business API
 * 
 * Envía mensajes por WhatsApp usando Meta Graph API
 * Recibe webhooks de mensajes entrantes
 * 
 * Setup:
 * 1. Crear app en https://developers.facebook.com
 * 2. Obtener token de acceso
 * 3. Configurar webhook
 */

import { z } from 'zod'

const whatsappMessageSchema = z.object({
  to: z.string(), // Teléfono destino (+569...)
  message: z.string(),
  template: z.string().optional(),
  templateParams: z.record(z.string()).optional(),
  mediaUrl: z.string().url().optional()
})

const webhookSchema = z.object({
  object: z.string(),
  entry: z.array(z.object({
    id: z.string(),
    changes: z.array(z.object({
      value: z.object({
        messaging_product: z.string(),
        metadata: z.object({
          display_phone_number: z.string(),
          phone_number_id: z.string()
        }),
        messages: z.array(z.object({
          from: z.string(),
          id: z.string(),
          timestamp: z.string(),
          type: z.string(),
          text: z.object({ body: z.string() }).optional()
        })).optional()
      }),
      field: z.string()
    }))
  }))
})

export interface WhatsAppMessage {
  to: string
  message: string
  template?: string
  templateParams?: Record<string, string>
  mediaUrl?: string
}

export interface WhatsAppWebhook {
  messaging_product: string
  phone_number_id: string
  from: string
  message: string
  timestamp: string
}

/**
 * Enviar mensaje de WhatsApp
 */
export async function sendWhatsAppMessage(
  message: WhatsAppMessage
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    const validated = whatsappMessageSchema.parse(message)
    
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    
    if (!phoneNumberId || !accessToken) {
      return {
        success: false,
        error: 'WhatsApp credentials not configured'
      }
    }

    // Mensaje de texto simple
    let body: any = {
      messaging_product: 'whatsapp',
      to: validated.to.replace(/\+/g, ''),
      type: 'text',
      text: { body: validated.message }
    }

    // Mensaje con template
    if (validated.template) {
      body = {
        messaging_product: 'whatsapp',
        to: validated.to.replace(/\+/g, ''),
        type: 'template',
        template: {
          name: validated.template,
          language: { code: 'es' },
          components: validated.templateParams ? [{
            type: 'body',
            parameters: Object.entries(validated.templateParams).map(([key, value]) => ({
              type: 'text',
              text: value
            }))
          }] : undefined
        }
      }
    }

    // Mensaje con media
    if (validated.mediaUrl) {
      body = {
        messaging_product: 'whatsapp',
        to: validated.to.replace(/\+/g, ''),
        type: 'image',
        image: {
          link: validated.mediaUrl,
          caption: validated.message
        }
      }
    }

    const response = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(body)
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', data)
      return {
        success: false,
        error: data.error?.message || 'Error sending WhatsApp message'
      }
    }

    return {
      success: true,
      messageId: data.messages?.[0]?.id
    }

  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Procesar webhook de WhatsApp
 */
export async function processWhatsAppWebhook(
  body: any
): Promise<{ success: boolean; messages?: WhatsAppWebhook[]; error?: string }> {
  try {
    const validated = webhookSchema.parse(body)

    // Verificar que es de WhatsApp
    if (validated.object !== 'whatsapp_business_account') {
      return {
        success: false,
        error: 'Invalid webhook object'
      }
    }

    const messages: WhatsAppWebhook[] = []

    for (const entry of validated.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          const value = change.value

          if (value.messages) {
            for (const msg of value.messages) {
              messages.push({
                messaging_product: value.messaging_product,
                phone_number_id: value.metadata.phone_number_id,
                from: msg.from,
                message: msg.text?.body || '',
                timestamp: msg.timestamp
              })
            }
          }
        }
      }
    }

    return {
      success: true,
      messages
    }

  } catch (error) {
    console.error('Error processing webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid webhook payload'
    }
  }
}

/**
 * Plantillas predefinidas para SmarterBot
 */
export const WHATSAPP_TEMPLATES = {
  // Bienvenida nuevo cliente
  WELCOME: {
    name: 'smarterbot_welcome',
    params: (nombre: string, tenant: string) => ({
      nombre,
      tenant
    })
  },

  // Recordatorio de pago
  PAYMENT_REMINDER: {
    name: 'payment_reminder',
    params: (monto: string, vencimiento: string) => ({
      monto,
      vencimiento
    })
  },

  // Confirmación de activación
  ACTIVATION_CONFIRMED: {
    name: 'activation_confirmed',
    params: (tenant: string, plan: string) => ({
      tenant,
      plan
    })
  },

  // Ecocupon validado
  ECOCUPON_VALIDATED: {
    name: 'ecocupon_validated',
    params: (puntos: string, total: string) => ({
      puntos,
      total
    })
  }
}

/**
 * Enviar mensaje usando template
 */
export async function sendWhatsAppTemplate(
  to: string,
  template: keyof typeof WHATSAPP_TEMPLATES,
  params: Record<string, string>
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const templateConfig = WHATSAPP_TEMPLATES[template]

  if (!templateConfig) {
    return {
      success: false,
      error: `Template ${template} not found`
    }
  }

  return sendWhatsAppMessage({
    to,
    message: '',
    template: templateConfig.name,
    templateParams: params
  })
}
