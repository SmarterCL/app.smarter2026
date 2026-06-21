import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { tenantTools } from '../../../mcp/tools/supabase-tenants'
import { fastapiTools } from '../../../mcp/tools/fastapi-proxy'

export const dynamic = 'force-dynamic'

export async function GET() {
  const enabled = process.env.MCP_ENABLED === 'true'
  const { userId } = await auth()
  const availableTools = Object.keys({ ...tenantTools, ...fastapiTools }).sort()
  return NextResponse.json({
    ok: true,
    enabled,
    authenticated: !!userId,
    availableTools,
    rateLimit: { windowMs: 60000, maxRequests: 30 },
    executeEndpoint: '/api/mcp/tool',
    executeMethod: 'POST',
    example: { name: 'tenants.list', args: {} },
  })
}
