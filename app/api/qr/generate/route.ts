import { NextResponse } from 'next/server'
import QRCode from 'qrcode'
import { createClient } from '@supabase/supabase-js'

const QR_BASE_URL = 'https://qr.smarterbot.store'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenant_id')
    const rut = searchParams.get('rut')
    const format = searchParams.get('format') || 'png' // png, svg, dataURL

    if (!tenantId && !rut) {
      return NextResponse.json(
        { error: 'Se requiere tenant_id o rut' },
        { status: 400 }
      )
    }

    // Si no hay tenant_id, buscar por rut
    let finalTenantId = tenantId

    if (!finalTenantId && rut) {
      const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (!supabaseUrl || !supabaseKey) {
        return NextResponse.json(
          { error: 'Configuración de servidor incompleta' },
          { status: 500 }
        )
      }

      const supabase = createClient(supabaseUrl, supabaseKey)

      const { data } = await supabase
        .from('tenants')
        .select('tenant_id')
        .eq('rut', rut.replace(/\./g, '').replace(/-/g, ''))
        .single()

      if (!data) {
        return NextResponse.json(
          { error: 'Tenant no encontrado' },
          { status: 404 }
        )
      }

      finalTenantId = data.tenant_id
    }

    // URL del QR (apunta al flujo del tenant)
    const qrUrl = `${QR_BASE_URL}/${finalTenantId}`

    // Generar QR según formato solicitado
    if (format === 'svg') {
      const svg = await QRCode.toString(qrUrl, {
        type: 'svg',
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        }
      })

      return new NextResponse(svg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable'
        }
      })
    }

    if (format === 'dataURL') {
      const dataUrl = await QRCode.toDataURL(qrUrl, {
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff'
        },
        width: 512
      })

      return NextResponse.json({
        dataUrl,
        qrUrl,
        tenantId: finalTenantId
      })
    }

    // Default: PNG buffer
    const pngBuffer = await QRCode.toBuffer(qrUrl, {
      type: 'png',
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      },
      width: 512
    })

    return new NextResponse(pngBuffer, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': `attachment; filename="qr-${finalTenantId}.png"`
      }
    })

  } catch (error) {
    console.error('Error generating QR code:', error)
    return NextResponse.json(
      { error: 'Error al generar código QR' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  // POST para generar QR con personalización
  try {
    const body = await request.json()
    const { tenantId, rut, color = '#000000', logo, size = 512 } = body

    if (!tenantId && !rut) {
      return NextResponse.json(
        { error: 'Se requiere tenant_id o rut' },
        { status: 400 }
      )
    }

    // URL del QR
    const qrUrl = `${QR_BASE_URL}/${tenantId || rut}`

    // Generar QR personalizado
    const dataUrl = await QRCode.toDataURL(qrUrl, {
      type: 'image/png',
      margin: 2,
      color: {
        dark: color,
        light: '#ffffff'
      },
      width: size
      // TODO: Agregar soporte para logo cuando tengamos assets
    })

    return NextResponse.json({
      dataUrl,
      qrUrl,
      tenantId: tenantId || rut
    })

  } catch (error) {
    console.error('Error generating custom QR code:', error)
    return NextResponse.json(
      { error: 'Error al generar código QR personalizado' },
      { status: 500 }
    )
  }
}
