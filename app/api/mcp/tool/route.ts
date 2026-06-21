import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { tenantTools } from '../../../../mcp/tools/supabase-tenants';
import { fastapiTools } from '../../../../mcp/tools/fastapi-proxy';
import { logMcpInvocation } from '../../../../lib/mcp-invocation-repository';

export const dynamic = 'force-dynamic';

// Simple in-memory rate limit (per userId/IP) for this runtime instance.
const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;
type Bucket = { count: number; expires: number };
const buckets = new Map<string, Bucket>();

function rateLimit(key: string) {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.expires < now) {
    buckets.set(key, { count: 1, expires: now + WINDOW_MS });
    return { allowed: true };
  }
  if (bucket.count >= MAX_REQUESTS) {
    return { allowed: false, retryAfter: bucket.expires - now };
  }
  bucket.count += 1;
  return { allowed: true };
}

type ToolFn = (args: any) => Promise<any>;
const tools: Record<string, ToolFn> = { ...tenantTools, ...fastapiTools };

export async function GET() {
  // Provide a simple descriptor so a browser visit (GET) doesn't yield 405.
  const enabled = process.env.MCP_ENABLED === 'true';
  const available = Object.keys(tools).sort();
  return NextResponse.json({
    ok: true,
    enabled,
    usage: {
      method: 'POST',
      bodyExample: { name: 'tenants.list', args: {} },
    },
    availableTools: available,
  });
}

export async function HEAD() {
  return new Response(null, { status: 200, headers: { 'x-mcp-tools': Object.keys(tools).length.toString() } })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: { 'Allow': 'GET,POST,HEAD,OPTIONS', 'Access-Control-Allow-Methods': 'GET,POST,HEAD,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization' } })
}

export async function POST(request: Request) {
  const enabled = process.env.MCP_ENABLED === 'true';
  if (!enabled) {
    return NextResponse.json({ ok: false, error: 'mcp_disabled', message: 'MCP_ENABLED not true' }, { status: 403 });
  }

  const { userId, sessionId } = await auth();
  const url = new URL(request.url);
  const debugMode = url.searchParams.get('debug') === '1';
  if (!userId) {
    // Allow a debug inspection if caller passes ?debug=1
    if (debugMode) {
      return NextResponse.json({
        ok: false,
        error: 'unauthorized',
        debug: {
          cookies: request.headers.get('cookie') || null,
          hasAuth: !!userId,
          sessionId: sessionId || null,
          note: 'No userId from Supabase Auth; verify cookies and Supabase configuration.'
        }
      }, { status: 401 });
    }
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  let body: { name?: string; args?: any };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'invalid_json' }, { status: 400 });
  }
  const { name, args } = body || {};
  if (!name) {
    return NextResponse.json({ ok: false, error: 'missing_name' }, { status: 400 });
  }

  // Rate limit per user.
  const rl = rateLimit(userId);
  if (!rl.allowed) {
    return NextResponse.json({ ok: false, error: 'rate_limited', retryAfterMs: rl.retryAfter }, { status: 429 });
  }

  const toolFn = tools[name];
  if (!toolFn) {
    return NextResponse.json({ ok: false, error: 'tool_not_found', name }, { status: 404 });
  }

  const started = performance.now();
  try {
    const result = await toolFn(args);
    const durationMs = Math.round(performance.now() - started);
    console.info('[MCP_INVOCATION]', { userId, tool: name, durationMs });
    logMcpInvocation({ user_id: userId, tool: name, args, result, duration_ms: durationMs }).catch(() => {});
    if (debugMode) {
      return NextResponse.json({
        auth: 'ok',
        hasCookies: !!(request.headers.get('cookie')), 
        sessionId: sessionId || null,
        userId,
        tool: name,
        ok: true,
        result,
        meta: { durationMs }
      });
    }
    return NextResponse.json({ ok: true, result, meta: { durationMs } });
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - started);
    console.warn('[MCP_INVOCATION_ERROR]', { userId, tool: name, durationMs, error: err?.message });
    if (debugMode) {
      return NextResponse.json({
        auth: 'ok',
        hasCookies: !!(request.headers.get('cookie')),
        sessionId: sessionId || null,
        userId,
        tool: name,
        ok: false,
        error: 'tool_error',
        message: err?.message || 'Unknown error',
        meta: { durationMs }
      }, { status: 500 });
    }
    return NextResponse.json({ ok: false, error: 'tool_error', message: err?.message || 'Unknown error', meta: { durationMs } }, { status: 500 });
  }
}
