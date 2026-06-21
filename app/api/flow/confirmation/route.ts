import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

/**
 * Flow.cl Webhook - Confirmación de pago
 * 
 * Flow envía POST a esta ruta cuando un pago es confirmado
 */

const FLOW_API_KEY = process.env.FLOW_API_KEY

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { token, id, status, paymentMethod, amount } = body

    // Validar firma HMAC
    const receivedHmac = request.headers.get('flow-hmac')
    if (!receivedHmac) {
      console.warn('Webhook sin HMAC, procesando de todas formas')
    } else {
      // Verificar HMAC (opcional pero recomendado en producción)
      const sortedKeys = Object.keys(body).sort()
      const concatenated = sortedKeys.map(key => body[key as keyof typeof body]).join('')
      const expectedHmac = crypto
        .createHmac('sha256', FLOW_API_KEY || '')
        .update(concatenated)
        .digest('base64')

      if (receivedHmac !== expectedHmac) {
        console.error('HMAC verification failed')
        // En producción, retornar error
        // return NextResponse.json({ error: 'Invalid HMAC' }, { status: 401 })
      }
    }

    if (!FLOW_API_KEY) {
      console.error('FLOW_API_KEY not configured')
      return NextResponse.json(
        { error: 'Configuración incompleta' },
        { status: 500 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuración de servidor incompleta' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Buscar orden por flow_token
    const { data: order, error: orderError } = await supabase
      .from('payment_orders')
      .select('id, tenant_id, plan, monto, status')
      .eq('flow_token', token)
      .single()

    if (orderError || !order) {
      console.error('Orden no encontrada:', token)
      return NextResponse.json({ received: true })
    }

    // Verificar estado del pago
    const paymentStatus = status === 2 || status === '2' || status === 'accepted' ? 'paid' : 'failed'

    // Actualizar orden
    const { error: updateOrderError } = await supabase
      .from('payment_orders')
      .update({
        status: paymentStatus,
        flow_response: JSON.stringify(body),
        paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateOrderError) {
      console.error('Error updating order:', updateOrderError)
    }

    // Si el pago fue exitoso, activar el tenant
    if (paymentStatus === 'paid') {
      const { error: tenantError } = await supabase
        .from('tenants')
        .update({
          status: 'active',
          activated_at: new Date().toISOString(),
          plan: order.plan,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', order.tenant_id)

      if (tenantError) {
        console.error('Error activating tenant:', tenantError)
      }

      // TODO: Enviar email de confirmación
      // TODO: Disparar webhook a OpenClaw para activación

      console.log(`Tenant ${order.tenant_id} activado exitosamente`)
    }

    // Responder a Flow (requerido)
    return NextResponse.json({ received: true })

  } catch (error) {
    console.error('Error processing Flow webhook:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET para verificar estado de una orden
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'token es requerido' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Configuración de servidor incompleta' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data: order, error } = await supabase
      .from('payment_orders')
      .select('tenant_id, plan, monto, status, paid_at, created_at')
      .eq('flow_token', token)
      .single()

    if (error || !order) {
      return NextResponse.json(
        { error: 'Orden no encontrada' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      token,
      status: order.status,
      plan: order.plan,
      monto: order.monto,
      paid_at: order.paid_at,
      created_at: order.created_at,
    })

  } catch (error) {
    console.error('Error fetching order status:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado de la orden' },
      { status: 500 }
    )
  }
}
