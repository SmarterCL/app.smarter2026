import { NextResponse } from "next/server"
import { verifyPhoneCode } from "@/lib/phone-verification"

export async function POST(request: Request) {
  try {
    const { tenant_id, code } = await request.json()
    if (!tenant_id || !code) {
      return NextResponse.json({ error: "tenant_id y code son requeridos" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const result = await verifyPhoneCode({
      supabaseUrl,
      serviceRoleKey,
      tenantId: tenant_id,
      code,
    })

    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}
