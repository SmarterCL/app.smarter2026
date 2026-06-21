import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const enabled = process.env.MCP_ENABLED === 'true';
  if (!enabled) {
    return NextResponse.json({ ok: false, service: 'mcp', disabled: true, reason: 'MCP_ENABLED not true' });
  }
  return NextResponse.json({ ok: true, service: 'mcp', version: '0.0.1' });
}
