import { auth } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()
  try {
    const a = await auth()
    return NextResponse.json({
      ok: true,
      userId: a.userId || null,
      sessionId: a.sessionId || null,
      orgId: (a as any).orgId || null,
      duration_ms: Date.now() - start,
      debug: {
        hasAuth: !!a.userId,
        env: {
          SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        }
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: 'auth_error',
      message: error?.message,
      stack: error?.stack,
      duration_ms: Date.now() - start,
    }, { status: 500 })
  }
}
