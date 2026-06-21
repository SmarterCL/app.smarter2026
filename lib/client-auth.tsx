"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

type ClientUser = {
  id: string
  fullName: string
  firstName: string
  imageUrl: string
  lastSignInAt: Date | null
  primaryEmailAddress: {
    emailAddress: string
  } | null
}

const toClientUser = (user: User | null): ClientUser | null => {
  if (!user) return null

  const email = user.email || ""
  const fullName =
    typeof user.user_metadata?.full_name === "string"
      ? user.user_metadata.full_name
      : typeof user.user_metadata?.name === "string"
        ? user.user_metadata.name
        : email.split("@")[0] || "SmarterOS"

  return {
    id: user.id,
    fullName,
    firstName: fullName.split(/\s+/)[0] || fullName,
    imageUrl: typeof user.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : "",
    lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
    primaryEmailAddress: email ? { emailAddress: email } : null,
  }
}

export function useUser() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<ClientUser | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return
      setUser(toClientUser(data.user))
      setIsLoaded(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(toClientUser(session?.user ?? null))
      setIsLoaded(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [supabase])

  return {
    isLoaded,
    isSignedIn: !!user,
    user,
  }
}

export function useAuth() {
  const { isLoaded, isSignedIn, user } = useUser()

  return {
    isLoaded,
    isSignedIn,
    userId: user?.id ?? null,
  }
}

export function UserButton(_props: Record<string, unknown>) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  return (
    <button
      className="rounded-md border px-3 py-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      onClick={() => supabase.auth.signOut()}
      type="button"
    >
      Salir
    </button>
  )
}

export function SignOutButton({ children }: { children?: ReactNode; [key: string]: unknown }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  return (
    <button onClick={() => supabase.auth.signOut()} type="button">
      {children || "Salir"}
    </button>
  )
}

export function SignInButton({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <a href="/login">{children || "Ingresar"}</a>
}

export function SignUpButton({ children }: { children?: ReactNode; [key: string]: unknown }) {
  return <a href="/login">{children || "Crear cuenta"}</a>
}
