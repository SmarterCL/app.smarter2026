import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getDefaultFromAddress, getSmtpTransport, hasSmtpConfig } from '@/lib/smtp'

type ContactPayload = {
  name?: string
  email?: string
  message?: string
  phone?: string | null
  source?: string | null
}

async function sendEmails(payload: Required<Pick<ContactPayload, 'name' | 'email' | 'message'>> & { phone?: string | null; source?: string | null }) {
  const transport = getSmtpTransport()
  const from = getDefaultFromAddress()
  const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'smarterbotcl@gmail.com'
  if (!transport || !hasSmtpConfig()) return

  await transport.sendMail({
    from,
    to: [payload.email],
    subject: 'Gracias por contactar a Smarter OS',
    html: `
      <div style="font-family:Inter,system-ui,Segoe UI,Arial,sans-serif">
        <h2>¡Gracias, ${payload.name}!</h2>
        <p>Recibimos tu mensaje y te responderemos muy pronto.</p>
        <p><strong>Mensaje:</strong><br/>${(payload.message || '').replace(/</g, '&lt;')}</p>
        <p>Puedes acceder al panel central en <a href="https://app.smarterbot.store" target="_blank">app.smarterbot.store</a>.</p>
        <hr />
        <small>Smarter OS</small>
      </div>`,
  })

  await transport.sendMail({
    from,
    to: [ADMIN_EMAIL],
    subject: `Nuevo contacto: ${payload.name} <${payload.email}>`,
    html: `
      <div style="font-family:Inter,system-ui,Segoe UI,Arial,sans-serif">
        <h3>Nuevo contacto</h3>
        <ul>
          <li><strong>Nombre:</strong> ${payload.name}</li>
          <li><strong>Email:</strong> ${payload.email}</li>
          <li><strong>WhatsApp:</strong> ${payload.phone || '-'}</li>
          <li><strong>Source:</strong> ${payload.source || '-'}</li>
        </ul>
        <pre style="white-space:pre-wrap">${(payload.message || '').replace(/</g, '&lt;')}</pre>
      </div>`,
  })
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ContactPayload
    const name = (body.name || '').toString().trim()
    const email = (body.email || '').toString().trim().toLowerCase()
    const message = (body.message || '').toString().trim()
    const phone = body.phone ? body.phone.toString().trim() : null
    const source = body.source ? body.source.toString().trim() : null

    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    const SUPABASE_URL = process.env.SUPABASE_URL
    const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE)
    const { error } = await supabase
      .from('contacts')
      .insert([{ name, email, message, phone, source, domain: req.headers.get('host') || null }])

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // fire-and-forget emails (do not block response if it fails)
    sendEmails({ name, email, message, phone, source }).catch(() => {})

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}
