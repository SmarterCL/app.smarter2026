import { NextResponse } from "next/server"

export async function GET() {
  const keys = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'FASTAPI_URL',
    'NEXT_PUBLIC_DEMO_MODE'
  ] as const

  const present: Record<string, boolean> = {}
  for (const k of keys) {
    present[k] = typeof process.env[k] === 'string' && process.env[k]!.length > 10
  }

  return NextResponse.json({
    ok: true,
    env: present,
    missing: Object.entries(present).filter(([_, v]) => !v).map(([k]) => k),
    note: 'Keys reported as false/short are missing or too short (<11 chars).'
  })
}
