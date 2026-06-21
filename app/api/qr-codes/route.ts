import { NextRequest, NextResponse } from "next/server"

// NoCodeAPI QR Code endpoint
// Note: This is a pre-configured endpoint that doesn't require additional auth
const NOCODEAPI_BASE = "https://v1.nocodeapi.com/smarterbot/qrCode/PCAbTfWyTtVzBTes"

// Fallback: Direct QR code generation using QR Server API (free, no auth required)
const QR_SERVER_API = "https://api.qrserver.com/v1/create-qr-code/"

export async function GET() {
  try {
    // Try to fetch from NoCodeAPI first
    const response = await fetch(`${NOCODEAPI_BASE}/get`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      // NoCodeAPI doesn't support listing or has issues - return empty
      return NextResponse.json({ success: true, data: [] })
    }

    const data = await response.json()
    return NextResponse.json({ success: true, data: data.data || data })
  } catch (error) {
    console.error("Error fetching QR codes:", error)
    // Return empty array on error
    return NextResponse.json({ success: true, data: [] })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phoneNumber, message, name } = body

    if (!phoneNumber) {
      return NextResponse.json(
        { success: false, error: "El número de teléfono es requerido" },
        { status: 400 }
      )
    }

    // Format WhatsApp message URL
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message || "Hola! Estoy interesado en tus servicios")}`

    // Try NoCodeAPI first
    try {
      const response = await fetch(NOCODEAPI_BASE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          url: whatsappUrl,
          size: 300,
          format: "png",
          name: name || `QR WhatsApp - ${phoneNumber}`,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        return NextResponse.json({ 
          success: true, 
          data: {
            ...data,
            qr_code_url: data.qr_code_url || data.url || data.image,
            phone_number: phoneNumber,
            message: message,
            name: name || `QR WhatsApp - ${phoneNumber}`,
            created_at: new Date().toISOString(),
          }
        })
      }
    } catch (nocodeError) {
      console.warn("NoCodeAPI failed, using fallback:", nocodeError)
      // Fall through to fallback
    }

    // Fallback: Generate QR code URL using QR Server API
    // This creates a direct URL to the QR code image
    const qrCodeUrl = `${QR_SERVER_API}?size=300x300&data=${encodeURIComponent(whatsappUrl)}&format=png&margin=10`

    return NextResponse.json({ 
      success: true, 
      data: {
        qr_code_url: qrCodeUrl,
        url: whatsappUrl,
        phone_number: phoneNumber,
        message: message,
        name: name || `QR WhatsApp - ${phoneNumber}`,
        created_at: new Date().toISOString(),
        provider: "qrserver",
      }
    })
  } catch (error) {
    console.error("Error generating QR code:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "No se pudo generar el código QR" 
      },
      { status: 500 }
    )
  }
}
