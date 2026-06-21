import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * Endpoint para registrar scans de QR
 * Dispara eventos a OpenClaw para procesamiento
 * 
 * POST /api/scan
 * {
 *   tenant_id: string,
 *   flujo_id?: string,
 *   device_id?: string,
 *   metadata?: object
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { tenant_id, flujo_id, device_id, metadata = {} } = body

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id es requerido' },
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

    // Buscar tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id, tenant_id, status, plan, scans_mes_count, scans_mes_limit, scans_mes_reset_at')
      .eq('tenant_id', tenant_id)
      .single()

    if (tenantError || !tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    // Verificar estado
    if (tenant.status !== 'active') {
      return NextResponse.json(
        { error: 'Cuenta no activa. Contacta soporte.' },
        { status: 403 }
      )
    }

    // Verificar límites de scans
    const needsReset = tenant.scans_mes_reset_at && 
      new Date(tenant.scans_mes_reset_at) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const currentScans = needsReset ? 0 : tenant.scans_mes_count
    const limit = tenant.scans_mes_limit

    if (limit !== -1 && currentScans >= limit) {
      return NextResponse.json(
        { 
          error: 'Límite de scans mensuales alcanzado',
          limit,
          current: currentScans,
          upgrade: true
        },
        { status: 429 }
      )
    }

    // Incrementar contador de scans
    const { error: updateError } = await supabase
      .from('tenants')
      .update({
        scans_mes_count: needsReset ? 1 : currentScans + 1,
        scans_mes_reset_at: needsReset ? new Date().toISOString() : tenant.scans_mes_reset_at,
      })
      .eq('id', tenant.id)

    if (updateError) {
      console.error('Error updating scan count:', updateError)
    }

    // Registrar evento de scan (para analytics)
    const { data: scanRecord, error: scanError } = await supabase
      .from('scan_events')
      .insert({
        tenant_id,
        flujo_id: flujo_id || null,
        device_id: device_id || null,
        metadata,
        scanned_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (scanError) {
      // Tabla scan_events no existe aún, continuar sin error
      console.log('scan_events table not available, skipping event logging')
    }

    // Disparar webhook a OpenClaw (si está configurado)
    const openClawUrl = process.env.OPENCLAW_WEBHOOK_URL
    if (openClawUrl) {
      try {
        await fetch(openClawUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENCLAW_API_TOKEN || ''}`
          },
          body: JSON.stringify({
            event: 'scan',
            tenant_id,
            flujo_id,
            device_id,
            timestamp: new Date().toISOString(),
            metadata
          }),
        })
      } catch (webhookError) {
        console.error('Error triggering OpenClaw webhook:', webhookError)
        // No fallar la respuesta por error en webhook
      }
    }

    // Respuesta exitosa
    return NextResponse.json({
      success: true,
      scan_id: scanRecord?.id || crypto.randomUUID(),
      tenant_id,
      scans_remaining: limit === -1 ? -1 : limit - (currentScans + 1),
      limit,
    })

  } catch (error) {
    console.error('Error processing scan:', error)
    return NextResponse.json(
      { error: 'Error al procesar scan' },
      { status: 500 }
    )
  }
}

/**
 * GET para verificar estado de tenant
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id es requerido' },
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

    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('tenant_id, status, plan, scans_mes_count, scans_mes_limit, flujos_count, flujos_limit, devices_count, devices_limit')
      .eq('tenant_id', tenant_id)
      .single()

    if (error || !tenant) {
      return NextResponse.json(
        { error: 'Tenant no encontrado' },
        { status: 404 }
      )
    }

    // Verificar si necesita reset de scans
    const needsReset = tenant.scans_mes_limit && 
      new Date() > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    
    const currentScans = needsReset ? 0 : tenant.scans_mes_count

    return NextResponse.json({
      tenant_id: tenant.tenant_id,
      status: tenant.status,
      plan: tenant.plan,
      usage: {
        scans: {
          current: currentScans,
          limit: tenant.scans_mes_limit,
          remaining: tenant.scans_mes_limit === -1 ? -1 : tenant.scans_mes_limit - currentScans
        },
        flujos: {
          current: tenant.flujos_count,
          limit: tenant.flujos_limit
        },
        devices: {
          current: tenant.devices_count,
          limit: tenant.devices_limit
        }
      }
    })

  } catch (error) {
    console.error('Error fetching tenant status:', error)
    return NextResponse.json(
      { error: 'Error al obtener estado del tenant' },
      { status: 500 }
    )
  }
}
