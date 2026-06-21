import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

/**
 * API Ecocupon - SmarterLAB
 * 
 * Valida ecocupones desde el camión
 * Cruza datos con Walmart + Cortical Labs
 * 
 * POST /api/ecocupon/validar
 * {
 *   codigo_qr: "ECO123456789",
 *   validador_id: "camion-1",
 *   material: "plastico",
 *   peso_gramos: 500,
 *   tenant_id: "uuid"
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { codigo_qr, validador_id, material, peso_gramos, tenant_id } = body

    // Validaciones básicas
    if (!codigo_qr || !validador_id || !material) {
      return NextResponse.json(
        { error: 'Faltan parámetros requeridos' },
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

    // Llamar a función SQL para validar ecocupon
    const { data, error } = await supabase.rpc('validar_ecocupon', {
      p_codigo_qr: codigo_qr,
      p_validador_id: validador_id,
      p_material: material,
      p_peso_gramos: peso_gramos || 0
    })

    if (error) {
      console.error('Error validating ecocupon:', error)
      return NextResponse.json(
        { error: 'Error al validar ecocupón', details: error.message },
        { status: 500 }
      )
    }

    const result = data as any

    // Si hay coincidencia con Walmart, calcular puntos bonus
    if (result.success && result.transaccion_id) {
      // TODO: Verificar compra Walmart
      // const walmartMatch = await checkWalmartPurchase(tenant_id, producto)
      
      // TODO: Enviar a Cortical Labs para learning
      // await sendToCorticalLearning(result.transaccion_id)
    }

    return NextResponse.json({
      success: result.success || false,
      ecocupon_id: result.ecocupon_id,
      transaccion_id: result.transaccion_id,
      puntos_totales: result.puntos_totales || 0,
      mensaje: result.mensaje || 'Ecocupón validado',
    })

  } catch (error) {
    console.error('Error in ecocupon validation:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}

/**
 * GET para obtener estadísticas de reciclaje
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    const dias = parseInt(searchParams.get('dias') || '30')

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

    // Obtener estadísticas
    const { data, error } = await supabase.rpc('obtener_estadisticas_reciclaje', {
      p_tenant_id: tenant_id,
      p_dias: dias
    })

    if (error) {
      console.error('Error fetching stats:', error)
      return NextResponse.json(
        { error: 'Error al obtener estadísticas' },
        { status: 500 }
      )
    }

    const stats = Array.isArray(data) && data.length > 0 ? data[0] : {
      total_transacciones: 0,
      total_puntos_ganados: 0,
      total_kg_reciclados: 0,
      material_mas_comun: 'N/A',
      racha_dias: 0
    }

    return NextResponse.json({
      tenant_id,
      periodo_dias: dias,
      estadisticas: stats
    })

  } catch (error) {
    console.error('Error fetching recycling stats:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
