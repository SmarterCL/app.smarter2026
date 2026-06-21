import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import McpConsoleClient from '@/components/mcp-console-client'

// Force dynamic rendering; avoid any accidental static optimization
export const dynamic = 'force-dynamic'

export default async function McpConsolePage() {
  let authError: string | null = null
  let userId: string | null = null
  try {
    const a = await auth()
    userId = a.userId
    if (!a.userId) {
      console.warn('[MCP_DASHBOARD_AUTH_MISSING_USER] redirecting to /')
      redirect('/')
    }
    console.log('[MCP_DASHBOARD_AUTH_SUCCESS]', { userId })
  } catch (error: any) {
    authError = error?.message || 'unknown auth error'
    console.error('[MCP_DASHBOARD_AUTH_ERROR]', authError)
    // Instead of redirecting (which hides root cause), render a fallback
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <h1 className="text-2xl font-bold">MCP Console</h1>
          <div className="p-4 rounded border border-red-500/40 bg-red-500/10 text-red-500 text-sm">
            Authentication failed: {authError}
          </div>
          <p className="text-sm text-muted-foreground">If this persists, verify Supabase Auth cookies and local environment variables.</p>
        </div>
      </div>
    )
  }

  const mcpEnabled = process.env.MCP_ENABLED === 'true'

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">MCP Console</h1>
            <p className="text-muted-foreground mt-1">Model Context Protocol Tool Tester</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-3 py-1 rounded text-xs font-medium ${mcpEnabled ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {mcpEnabled ? 'ENABLED' : 'DISABLED'}
            </div>
          </div>
        </div>

        <McpConsoleClient mcpEnabled={mcpEnabled} />
      </div>
    </div>
  )
}
