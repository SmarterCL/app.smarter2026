/**
 * Telegram Mini App + Bot Integration
 * 
 * Crea mini apps dentro de Telegram
 * Envía mensajes, notificaciones, recibe comandos
 * 
 * Setup:
 * 1. Crear bot con @BotFather
 * 2. Obtener token
 * 3. Configar webhook
 */

import { z } from 'zod'

const telegramMessageSchema = z.object({
  chat_id: z.union([z.number(), z.string()]),
  text: z.string(),
  parse_mode: z.enum(['HTML', 'Markdown', 'MarkdownV2']).optional(),
  reply_markup: z.any().optional()
})

export interface TelegramMessage {
  chat_id: number | string
  text: string
  parse_mode?: 'HTML' | 'Markdown' | 'MarkdownV2'
  reply_markup?: any
}

/**
 * Enviar mensaje por Telegram
 */
export async function sendTelegramMessage(
  message: TelegramMessage
): Promise<{ success: boolean; message_id?: number; error?: string }> {
  try {
    const validated = telegramMessageSchema.parse(message)

    const botToken = process.env.TELEGRAM_BOT_TOKEN

    if (!botToken) {
      return {
        success: false,
        error: 'Telegram bot token not configured'
      }
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          chat_id: validated.chat_id,
          text: validated.text,
          parse_mode: validated.parse_mode,
          reply_markup: validated.reply_markup
        })
      }
    )

    const data = await response.json()

    if (!response.ok || !data.ok) {
      console.error('Telegram API error:', data)
      return {
        success: false,
        error: data.description || 'Error sending Telegram message'
      }
    }

    return {
      success: true,
      message_id: data.result.message_id
    }

  } catch (error) {
    console.error('Error sending Telegram message:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Enviar notificación con botones (Mini App style)
 */
export async function sendTelegramNotification(
  chat_id: number | string,
  title: string,
  message: string,
  buttons: Array<{ label: string; url?: string; callback?: string }>
): Promise<{ success: boolean; error?: string }> {
  const keyboard: any = {
    inline_keyboard: buttons.map(btn => [{
      text: btn.label,
      ...(btn.url ? { url: btn.url } : { callback_data: btn.callback })
    }])
  }

  return sendTelegramMessage({
    chat_id,
    text: `<b>${title}</b>\n\n${message}`,
    parse_mode: 'HTML',
    reply_markup: keyboard
  })
}

/**
 * Webhook handler para Telegram
 */
export async function processTelegramWebhook(
  body: any
): Promise<{ success: boolean; update?: any; error?: string }> {
  try {
    const { update_id, message, callback_query } = body

    if (message) {
      // Mensaje de texto
      const text = message.text
      const chat_id = message.chat.id
      const from = message.from

      console.log(`Telegram message from ${from.username}: ${text}`)

      // Comandos básicos
      if (text === '/start') {
        await sendTelegramNotification(
          chat_id,
          '¡Bienvenido a SmarterBot!',
          '¿Qué necesitas hoy?',
          [
            { label: '📊 Ver mi cuenta', callback: 'view_account' },
            { label: '💳 Pagar', callback: 'payment' },
            { label: '📞 Soporte', callback: 'support' }
          ]
        )
      }

      if (text === '/menu') {
        await sendTelegramNotification(
          chat_id,
          'Menú Digital',
          'Selecciona una categoría:',
          [
            { label: '🍔 Comida', callback: 'menu_food' },
            { label: '🍺 Bebidas', callback: 'menu_drinks' },
            { label: '🍦 Postres', callback: 'menu_desserts' }
          ]
        )
      }

      if (text === '/ecocupon') {
        await sendTelegramNotification(
          chat_id,
          '♻️ SmarterLAB Ecocupones',
          'Tus ecocupones activos:',
          [
            { label: '🎫 Ver cupones', callback: 'view_ecocupons' },
            { label: '📊 Historial', callback: 'ecocupon_history' }
          ]
        )
      }

      return {
        success: true,
        update: { type: 'message', chat_id, text, from }
      }
    }

    if (callback_query) {
      // Callback de botón inline
      const data = callback_query.data
      const chat_id = callback_query.message.chat.id

      console.log(`Telegram callback: ${data}`)

      // Responder al callback
      await fetch(
        `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/answerCallbackQuery`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            callback_query_id: callback_query.id,
            text: `Procesando: ${data}`
          })
        }
      )

      return {
        success: true,
        update: { type: 'callback', chat_id, data }
      }
    }

    return {
      success: true,
      update: body
    }

  } catch (error) {
    console.error('Error processing Telegram webhook:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid webhook'
    }
  }
}

/**
 * Crear Mini App URL para tenant
 */
export function getTelegramMiniAppUrl(tenantId: string, flujoId?: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://qr.smarterbot.store'
  const path = flujoId ? `/miniapp/${tenantId}/${flujoId}` : `/miniapp/${tenantId}`
  return `${baseUrl}${path}`
}

/**
 * Enviar Mini App a usuario
 */
export async function sendTelegramMiniApp(
  chat_id: number | string,
  tenantId: string,
  title: string,
  description: string,
  flujoId?: string
): Promise<{ success: boolean; error?: string }> {
  const appUrl = getTelegramMiniAppUrl(tenantId, flujoId)

  const keyboard = {
    inline_keyboard: [[
      {
        text: '🚀 Abrir App',
        web_app: { url: appUrl }
      }
    ]]
  }

  return sendTelegramMessage({
    chat_id,
    text: `<b>${title}</b>\n\n${description}`,
    parse_mode: 'HTML',
    reply_markup: keyboard
  })
}
