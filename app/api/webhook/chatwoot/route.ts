import { NextResponse } from 'next/server'
import { processChatwootWebhook } from '@/integrations/chatwoot'
import { sendWhatsAppMessage } from '@/integrations/whatsapp-meta'
import { sendTelegramMessage } from '@/integrations/telegram'

/**
 * Webhook de Chatwoot
 * 
 * Procesa eventos de conversaciones y mensajes
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const headers = request.headers
    const webhookSecret = headers.get('X-Chatwoot-Signature')

    // Verificar firma (opcional en desarrollo)
    if (webhookSecret && webhookSecret !== process.env.CHATWOOT_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Procesar webhook
    const result = await processChatwootWebhook(body)

    if (!result.success) {
      console.error('Error processing Chatwoot webhook:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    const { event, data } = result

    console.log(`Chatwoot event: ${event}`)

    // Procesar según evento
    switch (event) {
      case 'conversation_created':
        // Nueva conversación creada
        console.log('Nueva conversación:', data.id)
        
        // Enviar notificación por WhatsApp si es urgente
        if (data.status === 'open') {
          // TODO: Notificar al agente asignado
        }
        break

      case 'message_created':
        // Nuevo mensaje recibido
        if (data.message_type === 'incoming') {
          // Reenviar a Telegram si el usuario lo pidió
          // TODO: Implementar bridge WhatsApp ↔ Telegram
        }
        break

      case 'conversation_status_changed':
        // Conversación cerrada/abierta
        if (data.status === 'resolved') {
          // Enviar encuesta de satisfacción
          // TODO: Implementar NPS survey
        }
        break
    }

    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error in Chatwoot webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
