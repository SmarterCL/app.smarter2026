import { NextResponse } from 'next/server'
import { processTelegramWebhook, sendTelegramMessage } from '@/integrations/telegram'
import { sendWhatsAppMessage } from '@/integrations/whatsapp-meta'

/**
 * Webhook de Telegram Bot
 * 
 * Procesa mensajes y comandos
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Procesar webhook
    const result = await processTelegramWebhook(body)

    if (!result.success) {
      console.error('Error processing Telegram webhook:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const { update } = result

    if (update) {
      // Bridge: Telegram → WhatsApp (si el usuario lo pide)
      if (update.type === 'callback' && update.data === 'contact_support') {
        // Enviar notificación a WhatsApp del agente
        const agentPhone = process.env.SUPPORT_WHATSAPP_PHONE || '+56979540471'
        
        await sendWhatsAppMessage({
          to: agentPhone,
          message: `🔔 Nuevo soporte desde Telegram\n\nUsuario: ${update.chat_id}\nAcción: ${update.data}`
        })
      }
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error in Telegram webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
