import { NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getSupabaseClient } from '../../../../../lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  const enabled = process.env.MCP_ENABLED === 'true'
  if (!enabled) {
    return NextResponse.json({ ok: false, error: 'mcp_disabled' }, { status: 403 })
  }

  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }

  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('mcp_invocations')
      .select('id, created_at, tool, args, result, duration_ms')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(25)

    if (error) throw error

    const items = (data || []).map(row => {
      let parsedArgs: any = null
      let parsedResult: any = null
      try { parsedArgs = row.args ? JSON.parse(row.args) : null } catch {}
      try { parsedResult = row.result ? JSON.parse(row.result) : null } catch {}
      return {
        id: row.id,
        at: row.created_at,
        tool: row.tool,
        durationMs: row.duration_ms,
        args: parsedArgs,
        result: parsedResult,
      }
    })

    return NextResponse.json({ ok: true, items })
  } catch (err: any) {
    console.warn('[MCP_INVOCATIONS_RECENT_ERROR]', err?.message)
    return NextResponse.json({ ok: false, error: 'fetch_error', message: err?.message || 'Unknown error' }, { status: 500 })
  }
}
