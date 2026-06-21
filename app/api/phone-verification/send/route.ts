import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { createPhoneVerification } from "@/lib/phone-verification"

export async function POST(request: Request) {
  try {
    const { tenant_id } = await request.json()
    if (!tenant_id) {
      return NextResponse.json({ error: "tenant_id es requerido" }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Configuración de servidor incompleta" }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { data: tenant, error } = await supabase
      .from("tenants")
      .select("tenant_id, telefono, business_name, name, razon_social")
      .eq("tenant_id", tenant_id)
      .maybeSingle()

    if (error || !tenant) {
      return NextResponse.json({ error: "Tenant no encontrado" }, { status: 404 })
    }

    const result = await createPhoneVerification({
      supabaseUrl,
      serviceRoleKey,
      tenantId: tenant.tenant_id,
      phone: tenant.telefono,
      businessName: tenant.business_name || tenant.name || tenant.razon_social || "tu cuenta",
    })

    return NextResponse.json(result, { status: result.ok ? 200 : 502 })
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno" },
      { status: 500 }
    )
  }
}
