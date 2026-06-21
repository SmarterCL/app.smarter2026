import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createTenant } from "@/lib/supabase"

// Validación RUT chileno (formato: 12345678-9 o 12345678-K)
const rutRegex = /^\d{7,8}-[\dkK]$/

const tenantCreateSchema = z.object({
  rut: z.string().regex(rutRegex, "RUT inválido. Formato esperado: 12345678-9"),
  business_name: z.string().min(3, "Nombre comercial debe tener al menos 3 caracteres").max(255),
  contact_email: z.string().email("Email inválido"),
  services: z
    .object({
      crm: z.boolean().optional(),
      bot: z.boolean().optional(),
      erp: z.boolean().optional(),
      workflows: z.boolean().optional(),
      kpi: z.boolean().optional(),
    })
    .optional(),
})

export async function POST(req: Request) {
  try {
    // Auth check
    const authObj = await auth()
    const userId = authObj.userId
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Parse and validate body
    const body = await req.json()
    const validation = tenantCreateSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      )
    }

    const { rut, business_name, contact_email, services } = validation.data

    // Normalize RUT (uppercase K, remove spaces)
    const normalizedRut = rut.trim().toUpperCase().replace(/\s/g, "")

    // Generate tenant_id slug from business_name
    const tenantSlug = business_name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60)

    // Create tenant via Supabase helper
    const tenant = await createTenant({
      tenant_id: tenantSlug,
      name: business_name.trim(),
      rut: normalizedRut,
      business_name: business_name.trim(),
      contact_email: contact_email.trim().toLowerCase(),
      auth_user_id: userId,
      services_enabled: services || {
        crm: true,
        bot: false,
        erp: false,
        workflows: false,
        kpi: false,
      },
    })

    // Optional: call the SaaS bootstrap endpoint when tenant provisioning is enabled.
    // await fetch('https://api.smarterbot.store/tenants/bootstrap', {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Bearer ${process.env.FASTAPI_API_KEY}`,
    //   },
    //   body: JSON.stringify({ tenant_id: tenant.id }),
    // })

    return NextResponse.json(
      {
        success: true,
        tenant: {
          id: tenant.id,
          tenant_id: tenant.tenant_id,
          name: tenant.name,
          rut: tenant.rut,
          business_name: tenant.business_name,
          services_enabled: tenant.services_enabled,
          created_at: tenant.created_at,
        },
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Tenant creation error:", error)

    // Check for duplicate RUT error
    if (error?.code === "23505" || error?.message?.includes("duplicate key")) {
      return NextResponse.json(
        {
          error: "RUT already exists",
          message: "Ya existe un tenant registrado con este RUT",
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        message: error?.message || "Error creando tenant",
      },
      { status: 500 }
    )
  }
}
