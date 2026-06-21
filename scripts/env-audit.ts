const required = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'FASTAPI_URL',
]

const optional = [
  'NEXT_PUBLIC_DEMO_MODE',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'EMAIL_FROM',
  'BILLIONMAIL_SMTP_HOST',
  'BILLIONMAIL_SMTP_PORT',
  'BILLIONMAIL_SMTP_USER',
  'BILLIONMAIL_SMTP_PASS',
  'BILLIONMAIL_SMTP_FROM',
]

function mask(v?: string) {
  if (!v) return 'MISSING'
  if (v.length < 8) return 'SHORT'
  if (v.startsWith('https://')) return v
  return v.slice(0, 12) + '…'
}

const snapshot: Record<string, string> = {}
for (const k of [...required, ...optional]) {
  snapshot[k] = mask(process.env[k])
}

const missing = required.filter(k => !process.env[k])

console.log(JSON.stringify({ ok: missing.length === 0, missing, snapshot }, null, 2))
