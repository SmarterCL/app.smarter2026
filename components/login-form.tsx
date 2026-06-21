"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserSupabaseClient()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const emailParam = params.get("email")
    if (emailParam) {
      setEmail(emailParam)
    }
  }, [])

  const signInWithPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (signInError) {
      setError(signInError.message)
      return
    }

    router.replace("/dashboard")
    router.refresh()
  }

  const signInWithGoogle = async () => {
    setLoading(true)
    setError(null)
    setNotice(null)

    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (signInError) {
      setLoading(false)
      setError(signInError.message)
    }
  }

  const sendPasswordReset = async () => {
    setError(null)
    setNotice(null)

    if (!email.trim()) {
      setError("Ingresa tu email para enviar el enlace de recuperación.")
      return
    }

    setLoading(true)
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    })
    setLoading(false)

    if (resetError) {
      setError(resetError.message)
      return
    }

    setNotice("Te enviamos un enlace para crear una nueva contraseña.")
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center px-6">
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Acceso SmarterOS</h1>
          <p className="text-sm text-muted-foreground">Inicia sesión con Supabase Auth.</p>
        </div>

        <form className="space-y-4" onSubmit={signInWithPassword}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              autoComplete="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-emerald-600">{notice}</p> : null}

          <Button className="w-full" disabled={loading} type="submit">
            {loading ? "Ingresando..." : "Ingresar"}
          </Button>
          <button
            className="w-full text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            disabled={loading}
            onClick={sendPasswordReset}
            type="button"
          >
            Olvidé mi contraseña
          </button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
          <div className="h-px flex-1 bg-border" />
          OAuth
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button className="w-full" disabled={loading} onClick={signInWithGoogle} variant="outline">
          Continuar con Google
        </Button>
      </div>
    </div>
  )
}
