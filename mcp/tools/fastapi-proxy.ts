import { z } from 'zod'
import { auth } from '@/lib/auth'

const FASTAPI_BASE = process.env.FASTAPI_URL || 'https://api.smarterbot.store'

// Allowed paths for security (whitelist approach)
const ALLOWED_PATHS = [
  '/health',
  '/validate',
  '/contacts',
  '/tenants',
  '/services/provision',
  '/services/status',
  '/chatwoot/inbox',
  '/botpress/workspace',
  '/odoo/company',
]

async function requireUser() {
  const { userId } = await auth()
  if (!userId) throw new Error('UNAUTHORIZED')
  return userId
}

function isPathAllowed(path: string): boolean {
  return ALLOWED_PATHS.some(allowed => path.startsWith(allowed))
}

const FastAPIGetSchema = z.object({
  path: z.string().startsWith('/'),
})

const FastAPIPostSchema = z.object({
  path: z.string().startsWith('/'),
  body: z.record(z.any()).optional(),
})

export async function fastapiGet(args: { path: string }) {
  const userId = await requireUser()
  const { path } = FastAPIGetSchema.parse(args)
  
  if (!isPathAllowed(path)) {
    throw new Error(`Path not allowed: ${path}`)
  }
  
  const url = `${FASTAPI_BASE}${path}`
  const started = performance.now()
  
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    })
    
    const latency = Math.round(performance.now() - started)
    
    if (!res.ok) {
      throw new Error(`FastAPI responded ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    return { ok: true, data, meta: { latency } }
  } catch (err: any) {
    const latency = Math.round(performance.now() - started)
    throw new Error(`FastAPI GET failed (${latency}ms): ${err.message}`)
  }
}

export async function fastapiPost(args: { path: string; body?: Record<string, any> }) {
  const userId = await requireUser()
  const { path, body } = FastAPIPostSchema.parse(args)
  
  if (!isPathAllowed(path)) {
    throw new Error(`Path not allowed: ${path}`)
  }
  
  const url = `${FASTAPI_BASE}${path}`
  const started = performance.now()
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'X-User-ID': userId,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
    })
    
    const latency = Math.round(performance.now() - started)
    
    if (!res.ok) {
      throw new Error(`FastAPI responded ${res.status}: ${res.statusText}`)
    }
    
    const data = await res.json()
    return { ok: true, data, meta: { latency } }
  } catch (err: any) {
    const latency = Math.round(performance.now() - started)
    throw new Error(`FastAPI POST failed (${latency}ms): ${err.message}`)
  }
}

// Convenience wrappers for specific services
const ProvisionSchema = z.object({
  tenantId: z.string().uuid(),
  services: z.array(z.enum(['chatwoot', 'botpress', 'odoo'])),
})

export async function servicesProvision(args: { tenantId: string; services: string[] }) {
  const userId = await requireUser()
  const { tenantId, services } = ProvisionSchema.parse(args)
  
  return fastapiPost({
    path: '/services/provision',
    body: { tenant_id: tenantId, services, requested_by: userId },
  })
}

export async function servicesStatus(args: { tenantId: string }) {
  const userId = await requireUser()
  const validated = z.object({ tenantId: z.string().uuid() }).parse(args)
  
  return fastapiGet({
    path: `/services/status?tenant_id=${validated.tenantId}`,
  })
}

export const fastapiTools = {
  'fastapi.get': fastapiGet,
  'fastapi.post': fastapiPost,
  'services.provision': servicesProvision,
  'services.status': servicesStatus,
} as const

export type FastAPIToolNames = keyof typeof fastapiTools
