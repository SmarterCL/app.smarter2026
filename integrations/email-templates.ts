/**
 * Email Transaccional vía SMTP
 *
 * Envía emails de bienvenida, recordatorios, facturas
 * Templates predefinidos para SmarterBot
 */

import { z } from 'zod'
import { getDefaultFromAddress, getSmtpTransport, hasSmtpConfig } from '@/lib/smtp'

const emailSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
  from: z.string().email().optional()
})

export interface EmailMessage {
  to: string
  subject: string
  html: string
  text?: string
  from?: string
}

export async function sendEmail(
  message: EmailMessage
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const validated = emailSchema.parse(message)

    const transport = getSmtpTransport()
    const from = validated.from || getDefaultFromAddress()

    if (!transport || !hasSmtpConfig()) {
      return {
        success: false,
        error: 'SMTP not configured'
      }
    }

    const info = await transport.sendMail({
      from,
      to: validated.to,
      subject: validated.subject,
      html: validated.html,
      text: validated.text,
    })

    return {
      success: true,
      id: info.messageId
    }

  } catch (error) {
    console.error('Error sending email:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Template: Bienvenida nuevo cliente
 */
export async function sendWelcomeEmail(
  to: string,
  nombre: string,
  tenantId: string,
  plan: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }
    .content { background: #f8f9fa; padding: 30px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
    .footer { background: #f1f3f5; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 10px 10px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>¡Bienvenido a SmarterBot QR! 🚀</h1>
    </div>
    <div class="content">
      <p>Hola <strong>${nombre}</strong>,</p>
      
      <p>¡Tu cuenta ha sido creada exitosamente! Ahora tienes un QR inteligente que vende solo.</p>
      
      <h3>📦 Tu plan: ${plan.toUpperCase()}</h3>
      
      <h3>🔑 Tus credenciales:</h3>
      <ul>
        <li><strong>Tenant ID:</strong> <code>${tenantId}</code></li>
        <li><strong>Dashboard:</strong> <a href="https://qr.smarterbot.store/dashboard">qr.smarterbot.store/dashboard</a></li>
      </ul>
      
      <h3>🎯 Próximos pasos:</h3>
      <ol>
        <li>Ingresa a tu dashboard</li>
        <li>Descarga tu QR dinámico</li>
        <li>Configura tu primer flujo</li>
        <li>¡Comienza a recibir clientes!</li>
      </ol>
      
      <a href="https://qr.smarterbot.store/dashboard" class="button">Ir al Dashboard</a>
      
      <p style="margin-top: 30px;">¿Necesitas ayuda? Responde este email o escríbenos al WhatsApp +56 9 7954 0471.</p>
    </div>
    <div class="footer">
      <p>SmarterBot QR — Sistema operativo de eventos físicos para negocios</p>
      <p>Santiago, Chile © 2026</p>
    </div>
  </div>
</body>
</html>
  `

  const text = `
¡Bienvenido a SmarterBot QR!

Hola ${nombre},

Tu cuenta ha sido creada exitosamente.

Plan: ${plan.toUpperCase()}
Tenant ID: ${tenantId}

Próximos pasos:
1. Ingresa a qr.smarterbot.store/dashboard
2. Descarga tu QR dinámico
3. Configura tu primer flujo
4. ¡Comienza a recibir clientes!

¿Necesitas ayuda? Escríbenos al WhatsApp +56 9 7954 0471.

¡Bienvenido a bordo!
  `

  return sendEmail({
    to,
    subject: '¡Bienvenido a SmarterBot QR! 🚀',
    html,
    text
  })
}

/**
 * Template: Recordatorio de pago
 */
export async function sendPaymentReminderEmail(
  to: string,
  nombre: string,
  monto: number,
  vencimiento: string
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .alert { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .button { display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="container">
    <h2>⏰ Recordatorio de Pago</h2>
    
    <div class="alert">
      <strong>Monto:</strong> $${monto.toLocaleString('es-CL')}<br>
      <strong>Vencimiento:</strong> ${vencimiento}
    </div>
    
    <p>Hola ${nombre},</p>
    <p>Tu suscripción a SmarterBot QR está por vencer. Realiza el pago para mantener tu servicio activo.</p>
    
    <a href="https://qr.smarterbot.store/pago" class="button">Pagar Ahora</a>
    
    <p style="margin-top: 30px; font-size: 14px; color: #666;">
      ¿Ya realizaste el pago? Ignora este mensaje.
    </p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: '⏰ Recordatorio de Pago - SmarterBot QR',
    html
  })
}

/**
 * Template: Ecocupon validado (SmarterLAB)
 */
export async function sendEcocuponValidatedEmail(
  to: string,
  nombre: string,
  puntos: number,
  total: number
): Promise<{ success: boolean; error?: string }> {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .success { background: #d4edda; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
    .points { font-size: 48px; color: #28a745; text-align: center; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <h2>♻️ ¡Ecocupon Validado!</h2>
    
    <div class="success">
      <strong>¡Gracias por reciclar!</strong><br>
      Tus puntos han sido acreditados.
    </div>
    
    <p>Hola ${nombre},</p>
    
    <div class="points">
      +${puntos} puntos
    </div>
    
    <p style="text-align: center;">
      <strong>Total acumulado: ${total} puntos</strong>
    </p>
    
    <p style="margin-top: 30px;">
      Canjea tus puntos en comercios participantes o úsalos para descuentos en Walmart.
    </p>
  </div>
</body>
</html>
  `

  return sendEmail({
    to,
    subject: '♻️ ¡Ecocupon Validado! Ganaste ' + puntos + ' puntos',
    html
  })
}
