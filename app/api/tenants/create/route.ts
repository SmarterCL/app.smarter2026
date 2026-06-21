import crypto from "crypto"
import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@supabase/supabase-js"

// Validación RUT chileno (formato: 12345678-9 o 12345678-K)
const rutRegex = /^\d{7,8}-[\dkK]$/

const tenantCreateSchema = z.object({
  rut: z.string().regex(rutRegex, "RUT inválido. Formato esperado: 12345678-9"),
  business_name: z.string().min(3, "Nombre comercial debe tener al menos 3 caracteres").max(255).optional(),
  contact_email: z.string().email("Email inválido").optional(),
  razonSocial: z.string().min(3).max(255).optional(),
  giro: z.string().min(2).max(255).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
  telefono: z.string().min(8).optional(),
  nombreCompleto: z.string().min(3).optional(),
  plan: z.enum(["starter", "growth", "pro"]).optional(),
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

    const {
      rut,
      business_name,
      contact_email,
      razonSocial,
      giro,
      email,
      password,
      telefono,
      nombreCompleto,
      plan = "starter",
      services,
    } = validation.data

    // Normalize RUT (uppercase K, remove spaces)
    const normalizedRut = rut.trim().toUpperCase().replace(/\s/g, "")
    const businessName = (business_name || razonSocial || "").trim()
    const contactEmail = (contact_email || email || "").trim().toLowerCase()

    if (!businessName) {
      return NextResponse.json(
        { error: "Nombre comercial es requerido" },
        { status: 400 }
      )
    }

    if (!contactEmail) {
      return NextResponse.json(
        { error: "Email de contacto es requerido" },
        { status: 400 }
      )
    }

    const authObj = await auth()
    let userId = authObj.userId
    let createdAuthUserId: string | null = null
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: "Configuración de servidor incompleta" },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    if (!userId) {
      if (!email || !password || !nombreCompleto) {
        return NextResponse.json(
          { error: "Email, password y nombre completo son requeridos" },
          { status: 400 }
        )
      }

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: contactEmail,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: nombreCompleto,
          business_name: businessName,
        },
        app_metadata: {
          role: "tenant_owner",
          plan,
        },
      })

      if (authError || !authData.user) {
        const message = authError?.message || "No se pudo crear el usuario"
        const accountExists = /already|registered|exists|duplicate/i.test(message)
        return NextResponse.json(
          {
            error: accountExists
              ? "Ya existe una cuenta con este email. Inicia sesión para continuar."
              : "Error al crear el usuario. Intenta nuevamente.",
            code: accountExists ? "ACCOUNT_EXISTS" : "AUTH_CREATE_FAILED",
          },
          { status: accountExists ? 409 : 500 }
        )
      }

      userId = authData.user.id
      createdAuthUserId = userId
    }

    const tenantId = crypto.randomUUID()
    const apiKey = crypto.randomBytes(32).toString("hex")

    const { data: tenant, error: tenantError } = await supabase
      .from("tenants")
      .insert({
        tenant_id: tenantId,
        name: businessName,
        rut: normalizedRut,
        razon_social: businessName,
        giro: giro || null,
        email: contactEmail,
        telefono: telefono || null,
        nombre_completo: nombreCompleto || businessName,
        plan,
        status: "pending",
        api_key: apiKey,
        business_name: businessName,
        contact_email: contactEmail,
        auth_user_id: userId,
        created_via: "registration",
        services_enabled: services || {
          crm: true,
          bot: false,
          erp: false,
          workflows: false,
          kpi: false,
        },
      })
      .select()
      .single()

    if (tenantError || !tenant) {
      if (createdAuthUserId) {
        await supabase.auth.admin.deleteUser(createdAuthUserId)
      }

      if (tenantError?.code === "23505" || tenantError?.message?.includes("duplicate key")) {
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
          message: tenantError?.message || "Error creando tenant",
        },
        { status: 500 }
      )
    }

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
          contact_email: tenant.contact_email,
          plan: tenant.plan,
          status: tenant.status,
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
