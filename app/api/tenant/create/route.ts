import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'
import { PLANS, type PlanId } from '@/lib/plans'
import { createPhoneVerification } from '@/lib/phone-verification'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { rut, razonSocial, giro, email, password, telefono, nombreCompleto, plan = 'starter' } = body

    // Validaciones básicas
    if (!rut || !razonSocial || !email || !password || !nombreCompleto) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      )
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 8 caracteres' },
        { status: 400 }
      )
    }

    // Validar plan
    const planData = PLANS[plan as PlanId]
    if (!planData) {
      return NextResponse.json(
        { error: 'Plan inválido' },
        { status: 400 }
      )
    }

    // Inicializar cliente Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.error('Supabase credentials not configured')
      return NextResponse.json(
        { error: 'Configuración de servidor incompleta' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Generar IDs únicos
    const tenantId = crypto.randomUUID()
    const apiKey = crypto.randomBytes(32).toString('hex')

    // Formatear RUT (quitar puntos y guión para almacenamiento)
    const rutLimpio = rut.replace(/\./g, '').replace(/-/g, '')
    const rutNormalizado = rut.trim()
    const emailNormalizado = email.toLowerCase().trim()

    // Verificar si el RUT ya existe
    const { data: existingTenant } = await supabase
      .from('tenants')
      .select('id')
      .in('rut', [rutNormalizado, rutLimpio])
      .maybeSingle()

    if (existingTenant) {
      return NextResponse.json(
        { error: 'Este RUT ya tiene una cuenta registrada. Inicia sesión para continuar.', code: 'TENANT_EXISTS' },
        { status: 409 }
      )
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: emailNormalizado,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: nombreCompleto,
        business_name: razonSocial,
      },
      app_metadata: {
        role: 'tenant_owner',
        plan,
        tenant_id: tenantId,
      },
    })

    if (authError || !authData.user) {
      const message = authError?.message || 'No se pudo crear el usuario'
      const accountExists = /already|registered|exists|duplicate/i.test(message)
      return NextResponse.json(
        {
          error: accountExists
            ? 'Ya existe una cuenta con este email. Inicia sesión para continuar.'
            : 'Error al crear el usuario. Intenta nuevamente.',
          code: accountExists ? 'ACCOUNT_EXISTS' : 'AUTH_CREATE_FAILED',
        },
        { status: accountExists ? 409 : 500 }
      )
    }

    const authUserId = authData.user.id

    // Insertar nuevo tenant usando el esquema actual de la tabla tenants
    const { data, error } = await supabase
      .from('tenants')
      .insert({
        tenant_id: tenantId,
        rut: rutNormalizado,
        razon_social: razonSocial,
        giro,
        telefono,
        nombre_completo: nombreCompleto,
        api_key: apiKey,
        flujos_limit: planData.limits.flujos,
        devices_limit: planData.limits.devices,
        scans_mes_limit: planData.limits.scansMes,
        name: razonSocial,
        business_name: razonSocial,
        email: emailNormalizado,
        contact_email: emailNormalizado,
        auth_user_id: authUserId,
        plan: plan as PlanId,
        status: 'pending', // Pending hasta confirmar pago
        services_enabled: {
          crm: false,
          bot: false,
          erp: false,
          workflows: false,
          kpi: false,
        },
        verification_status: 'pending',
        created_via: 'qr_landing',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating tenant:', error)
      await supabase.auth.admin.deleteUser(authUserId)
      
      // Manejar error de RUT duplicado (race condition)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Este RUT ya está registrado. Inicia sesión para continuar.', code: 'TENANT_EXISTS' },
          { status: 409 }
        )
      }
      
      return NextResponse.json(
        { error: 'Error al crear tu cuenta. Intenta nuevamente.' },
        { status: 500 }
      )
    }

    const phoneVerification = await createPhoneVerification({
      supabaseUrl,
      serviceRoleKey: supabaseKey,
      tenantId,
      phone: telefono,
      businessName: razonSocial,
    })

    // Éxito - retornar datos del tenant (sin información sensible persistida)
    return NextResponse.json({
      success: true,
      tenant: {
        tenant_id: data.tenant_id,
        rut: data.rut,
        razon_social: data.business_name || data.name,
        email: data.contact_email || data.email,
        plan: data.plan,
        status: data.status,
        limits: {
          flujos: planData.limits.flujos,
          devices: planData.limits.devices,
          scansMes: planData.limits.scansMes,
        }
      },
      phone_verification: {
        sent: phoneVerification.ok,
        phone: phoneVerification.phone,
        expires_at: phoneVerification.expires_at,
        error: phoneVerification.ok ? undefined : phoneVerification.error,
      },
      api_key: data.api_key,
    })

  } catch (error) {
    console.error('Unexpected error in tenant creation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
