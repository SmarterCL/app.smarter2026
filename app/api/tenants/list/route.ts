import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { listTenantsForUser } from "@/lib/tenant-repository"

export async function GET() {
  try {
    // Auth check
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Fetch tenants with RLS (only user's own tenants)
    const tenants = await listTenantsForUser(userId)

    return NextResponse.json({
      success: true,
      tenants: tenants.map((t) => ({
        id: t.id,
        tenant_id: t.tenant_id,
        name: t.name,
        rut: t.rut,
        business_name: t.business_name,
        contact_email: t.contact_email,
        auth_user_id: t.auth_user_id,
        services_enabled: t.services_enabled,
        status: t.status,
        created_at: t.created_at,
      })),
      count: tenants.length,
    })
  } catch (error: any) {
    console.error("Tenant list error:", error)

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Error listando tenants",
      },
      { status: 500 }
    )
  }
}
