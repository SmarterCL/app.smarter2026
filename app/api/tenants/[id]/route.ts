import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { getTenantById } from "@/lib/supabase"

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await params

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: "Invalid tenant ID format" }, { status: 400 })
    }

    // Fetch tenant (RLS ensures ownership check)
    const tenant = await getTenantById(id)

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        tenant_id: tenant.tenant_id,
        name: tenant.name,
        rut: tenant.rut,
        business_name: tenant.business_name,
        contact_email: tenant.contact_email,
        auth_user_id: tenant.auth_user_id,
        services_enabled: tenant.services_enabled,
        status: tenant.status,
        created_at: tenant.created_at,
      },
    })
  } catch (error: any) {
    console.error("Tenant get error:", error)

    // Check if tenant not found or access denied (RLS)
    if (error?.code === "PGRST116" || error?.message?.includes("no rows")) {
      return NextResponse.json(
        {
          error: "Tenant not found",
          message: "Tenant no encontrado o sin permisos de acceso",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Error obteniendo tenant",
      },
      { status: 500 }
    )
  }
}
