import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { updateTenantServices } from "@/lib/tenant-repository"

const servicesUpdateSchema = z.object({
  crm: z.boolean().optional(),
  bot: z.boolean().optional(),
  erp: z.boolean().optional(),
  workflows: z.boolean().optional(),
  kpi: z.boolean().optional(),
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
    const validation = servicesUpdateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const services = validation.data

    // Update services (RLS ensures ownership)
    const tenant = await updateTenantServices(id, services)

    // TODO: Trigger service activation/deactivation workflows
    // For each service toggled ON, call bootstrap endpoint
    // For each service toggled OFF, call cleanup endpoint
    // Example:
    // if (services.crm === true && !tenant.chatwoot_inbox_id) {
    //   await fetch('https://api.smarterbot.store/tenants/${id}/bootstrap/crm', {
    //     method: 'POST',
    //     headers: { 'Authorization': `Bearer ${process.env.FASTAPI_API_KEY}` },
    //   })
    // }

    return NextResponse.json({
      success: true,
      tenant: {
        id: tenant.id,
        rut: tenant.rut,
        business_name: tenant.business_name,
        services_enabled: tenant.services_enabled,
        updated_at: tenant.updated_at,
      },
      message: "Servicios actualizados correctamente",
    })
  } catch (error: any) {
    console.error("Services update error:", error)

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
        message: error?.message || "Error actualizando servicios",
      },
      { status: 500 }
    )
  }
}
