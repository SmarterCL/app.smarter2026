import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { PLANS, type PlanId } from '@/lib/plans'

/**
 * Flow.cl Integration - Crear orden de pago
 * 
 * Documentación: https://www.flow.cl/docs/api.html
 */

const FLOW_COMMERCE_ID = process.env.FLOW_COMMERCE_ID
const FLOW_API_KEY = process.env.FLOW_API_KEY
const FLOW_API_URL = process.env.FLOW_API_URL || 'https://api.flow.cl'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, email, monto, plan, concepto, coupon_code } = body

    // Validaciones
    if (!tenant_id || !plan) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
        { status: 400 }
      )
    }

    if (!FLOW_COMMERCE_ID || !FLOW_API_KEY) {
      console.error('Flow credentials not configured')
      return NextResponse.json(
        { error: 'Configuración de pagos incompleta' },
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

    // Verificar que el tenant existe
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, rut, business_name, contact_email, status')
      .eq('tenant_id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    const planData = PLANS[plan as PlanId] || PLANS.starter
    const payerEmail = (email || tenant.contact_email || '').trim().toLowerCase()

    if (!payerEmail) {
      return NextResponse.json(
        { error: 'Falta email del cliente' },
        { status: 400 }
      )
    }

    let setupAmount = planData.price.setup
    const monthlyAmount = planData.price.monthly
    let appliedCoupon: {
      code: string
      discount_type: string
      discount_value: number
    } | null = null

    if (coupon_code) {
      const code = String(coupon_code).trim().toUpperCase()
      const { data: coupon } = await supabase
        .from('coupon')
        .select('code, discount_type, discount_value, is_active')
        .eq('code', code)
        .eq('is_active', true)
        .maybeSingle()

      if (coupon) {
        appliedCoupon = coupon
        if (coupon.discount_type === 'percent') {
          setupAmount = Math.max(0, Math.round(setupAmount * (1 - coupon.discount_value / 100)))
        } else if (coupon.discount_type === 'fixed') {
          setupAmount = Math.max(0, setupAmount - coupon.discount_value)
        }
      }
    }

    const totalAmount = setupAmount + monthlyAmount

    // Generar orden ID único
    const ordenCompra = crypto.randomBytes(8).toString('hex').toUpperCase()
    const fecha = new Date().toISOString()

    // Preparar datos para Flow
    const params = {
      commerceId: FLOW_COMMERCE_ID,
      email: payerEmail,
      subject: concepto || `Plan ${plan.toUpperCase()} - SmarterBot QR`,
      currency: 'CLP',
      amount: totalAmount,
      urlConfirmation: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.smarterbot.store'}/api/flow/confirmation`,
      urlReturn: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.smarterbot.store'}/dashboard/onboarding?payment=success`,
      commerceOrder: ordenCompra,
      externalId: tenant_id,
      metadata: JSON.stringify({
        tenant_id,
        plan,
        rut: tenant.rut,
        business_name: tenant.business_name,
        contact_email: payerEmail,
        coupon_code: appliedCoupon?.code || null,
        setup_amount: setupAmount,
        monthly_amount: monthlyAmount,
        total_amount: totalAmount,
      })
    }

    // Generar firma HMAC
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${params[key as keyof typeof params]}`)
      .join('')

    const hmac = crypto
      .createHmac('sha256', FLOW_API_KEY)
      .update(sortedParams)
      .digest('base64')

    // Crear orden en Flow
    const flowResponse = await fetch(`${FLOW_API_URL}/payment/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        ...params,
        hmac
      })
    })

    if (!flowResponse.ok) {
      const errorData = await flowResponse.json().catch(() => ({}))
      console.error('Flow API error:', errorData)
      return NextResponse.json(
        { error: 'Error al crear orden de pago' },
        { status: 500 }
      )
    }

    const flowData = await flowResponse.json()

    // Guardar orden en DB
    const { error: orderError } = await supabase
      .from('payment_orders')
      .insert({
        tenant_id,
        orden_compra: ordenCompra,
        flow_token: flowData.token,
        plan,
        monto: totalAmount,
        email: payerEmail,
        status: 'pending',
        metadata: params.metadata,
        created_at: new Date(),
      })

    if (orderError) {
      console.error('Error saving payment order:', orderError)
    }

    // Retornar URL de pago
    return NextResponse.json({
      success: true,
      url: flowData.url,
      token: flowData.token,
      orden_compra: ordenCompra,
      coupon_applied: appliedCoupon?.code || null,
      monto_total: totalAmount,
    })

  } catch (error) {
    console.error('Error creating payment order:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
