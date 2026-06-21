import { NextResponse } from "next/server"

async function checkUrl(url: string, timeoutMs = 4000) {
  const controller = new AbortController()
  const t = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { method: "HEAD", signal: controller.signal })
    return { url, ok: res.ok, status: res.status }
  } catch (e: any) {
    return { url, ok: false, status: 0, error: e?.message || "error" }
  } finally {
    clearTimeout(t)
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const urls: string[] = Array.isArray(body?.urls) ? body.urls : []
  if (!urls.length) return NextResponse.json({ results: [] })

  const checks = await Promise.all(urls.map((u) => checkUrl(u)))
  return NextResponse.json({ results: checks })
}
