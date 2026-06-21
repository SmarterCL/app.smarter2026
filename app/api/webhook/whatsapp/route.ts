import { NextResponse } from 'next/server'
import { processWhatsAppWebhook, sendWhatsAppMessage } from '@/integrations/whatsapp-meta'
import { createChatwootContact, createChatwootConversation } from '@/integrations/chatwoot'

/**
 * Webhook de WhatsApp (Meta)
 * 
 * Verifica token en GET
 * Procesa mensajes en POST
 */

// GET: Verificación del webhook
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified successfully')
    return new NextResponse(challenge, { status: 200 })
  }

  return new NextResponse('Forbidden', { status: 403 })
}

// POST: Procesar mensajes entrantes
export async function POST(request: Request) {
  try {
    const body = await request.json()

    // Procesar webhook
    const result = await processWhatsAppWebhook(body)

    if (!result.success) {
      console.error('Error processing webhook:', result.error)
      return NextResponse.json({ error: result.error }, { status: 400 })
    }

    // Procesar cada mensaje
    if (result.messages) {
      for (const msg of result.messages) {
        console.log(`Mensaje de ${msg.from}: ${msg.message}`)

        // 1. Crear contacto en Chatwoot
        const contactResult = await createChatwootContact({
          inbox_id: 1, // WhatsApp inbox
          name: msg.from,
          phone_number: msg.from
        })

        if (contactResult.success && contactResult.contact_id) {
          // 2. Crear conversación en Chatwoot
          await createChatwootConversation(
            1,
            contactResult.contact_id,
            `Mensaje de WhatsApp: ${msg.message}`
          )
        }

        // 3. Respuesta automática (opcional)
        if (msg.message.toLowerCase().includes('hola')) {
          await sendWhatsAppMessage({
            to: msg.from,
            message: '¡Hola! 👋 Gracias por contactar SmarterBot. ¿En qué podemos ayudarte?'
          })
        }

        if (msg.message.toLowerCase().includes('precio') || msg.message.toLowerCase().includes('plan')) {
          await sendWhatsAppMessage({
            to: msg.from,
            message: '📦 Nuestros planes:\n\n Starter: $25.000/mes\n Growth: $59.000/mes\n Pro: $180.000/mes\n\n¿Te gustaría agendar una demo?'
          })
        }
      }
    }

    // Responder a Meta (requerido)
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error in WhatsApp webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
