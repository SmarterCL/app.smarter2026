import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { updateTenantIntegrations } from "@/lib/tenant-repository"

const integrationsUpdateSchema = z.object({
 chatwoot_inbox_id: z.number().int().positive().optional(),
 botpress_workspace_id: z.string().min(1).optional(),
 odoo_company_id: z.number().int().positive().optional(),
 metabase_dashboard_id: z.string().min(1).optional(),
})

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    // Parse and validate body
    const body = await req.json()
    const validation = integrationsUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const integrations = validation.data

    // Update integrations (RLS ensures ownership)
    const tenant = await updateTenantIntegrations(id, integrations)

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        rut: tenant.rut,
        business_name: tenant.business_name,
        chatwoot_inbox_id: tenant.chatwoot_inbox_id,
        botpress_workspace_id: tenant.botpress_workspace_id,
        odoo_company_id: tenant.odoo_company_id,
        metabase_dashboard_id: tenant.metabase_dashboard_id,
        updated_at: tenant.updated_at,
      },
      message: "IDs de integración actualizados correctamente",
    })
  } catch (error: any) {
    console.error("Integrations update error:", error)

    // Check if tenant not found or access denied (RLS)
    if (error?.code === "PGRST116" || error?.message?.includes("no rows")) {
      return NextResponse.json(
        {
          error: "Tenant not found",
          message: "Tenant no encontrado o sin permisos de actualización",
        },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Error actualizando integraciones",
      },
      { status: 500 }
    )
  }
}
