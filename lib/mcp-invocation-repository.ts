import { getSupabaseClient } from "@/lib/supabase"

export async function logMcpInvocation(entry: {
  user_id: string
  tool: string
  args: any
  result: any
  duration_ms: number
}) {
  if (process.env.MCP_LOG_DB !== "true") return

  const supabase = getSupabaseClient()
  const payload = {
    user_id: entry.user_id,
    tool: entry.tool,
    args: JSON.stringify(entry.args).slice(0, 4000),
    result: JSON.stringify(entry.result).slice(0, 4000),
    duration_ms: entry.duration_ms,
  }
  const { error } = await supabase.from("mcp_invocations").insert(payload)
  if (error) {
    console.warn("[MCP] log insert failed", error.message)
  }
}
