import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { listTenantsForUser } from "@/lib/supabase"

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const tenants = await listTenantsForUser(userId)
    const tenant = tenants[0]

    if (!tenant) {
      return NextResponse.json(
        {
          success: false,
          error: "No tenant found for this user",
          tenant: null,
        },
        { status: 404 }
      )
    }

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
      waha: {
        session_name: tenant.tenant_id,
        status: "unknown",
      },
      chatwoot: {
        inbox_id: null,
        account_id: process.env.CHATWOOT_ACCOUNT_ID || "1",
      },
      tenants_count: tenants.length,
    })
  } catch (error: any) {
    console.error("Workspace bootstrap error:", error)
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Error inicializando workspace",
      },
      { status: 500 }
    )
  }
}
