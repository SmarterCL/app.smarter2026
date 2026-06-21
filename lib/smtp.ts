import nodemailer from 'nodemailer'

function toNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export function hasSmtpConfig() {
  return Boolean(
    (process.env.SMTP_HOST || process.env.BILLIONMAIL_SMTP_HOST) &&
      (process.env.SMTP_USER || process.env.BILLIONMAIL_SMTP_USER) &&
      (process.env.SMTP_PASS || process.env.BILLIONMAIL_SMTP_PASS)
  )
}

export function getSmtpTransport() {
  const host = process.env.SMTP_HOST || process.env.BILLIONMAIL_SMTP_HOST
  const port = toNumber(process.env.SMTP_PORT || process.env.BILLIONMAIL_SMTP_PORT, 587)
  const user = process.env.SMTP_USER || process.env.BILLIONMAIL_SMTP_USER
  const pass = process.env.SMTP_PASS || process.env.BILLIONMAIL_SMTP_PASS
  const secure = (process.env.SMTP_SECURE || process.env.BILLIONMAIL_SMTP_SECURE || `${port === 465}`).toLowerCase() === 'true'

  if (!host || !user || !pass) {
    return null
  }

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  })
}

export function getDefaultFromAddress() {
  return process.env.EMAIL_FROM || process.env.SMTP_FROM || process.env.BILLIONMAIL_SMTP_FROM || 'no-reply@smarterbot.store'
}
