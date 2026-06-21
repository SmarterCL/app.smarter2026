#!/usr/bin/env node
/**
 * Backend Health Monitor
 * 
 * Periodically calls /api/health and stores results in Supabase external_health table.
 * Run as cron job or systemd timer for continuous monitoring.
 * 
 * Usage:
 *   pnpm tsx scripts/monitor-backend.ts
 *   
 * Env required:
 *   NEXT_PUBLIC_SUPABASE_URL
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY for writes)
 */

import { createClient } from '@supabase/supabase-js'

const HEALTH_ENDPOINT = process.env.HEALTH_ENDPOINT || 'https://app.smarterbot.store/api/health'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env vars')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

async function checkHealth() {
  const started = Date.now()
  try {
    const res = await fetch(HEALTH_ENDPOINT, { cache: 'no-store' })
    const latency = Date.now() - started
    
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`)
    }
    
    const data = await res.json()
    const overallOk = data.ok === true
    
    await supabase.from('external_health').insert({
      service: 'app.smarterbot.store',
      status: overallOk ? 'ok' : 'degraded',
      latency_ms: latency,
      metadata: data,
    })
    
    console.log(`[${new Date().toISOString()}] Health check: ${overallOk ? 'OK' : 'DEGRADED'} (${latency}ms)`)
    return { ok: overallOk, latency }
  } catch (err: any) {
    const latency = Date.now() - started
    
    await supabase.from('external_health').insert({
      service: 'app.smarterbot.store',
      status: 'error',
      latency_ms: latency,
      error_message: err.message,
    })
    
    console.error(`[${new Date().toISOString()}] Health check FAILED (${latency}ms):`, err.message)
    return { ok: false, latency, error: err.message }
  }
}

// Run once
checkHealth().then((result) => {
  process.exit(result.ok ? 0 : 1)
})
