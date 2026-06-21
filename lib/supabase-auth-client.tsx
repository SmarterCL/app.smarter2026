"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import type { User } from "@supabase/supabase-js"
import { createBrowserSupabaseClient } from "@/lib/supabase-browser"

export type SupabaseClientUser = {
  id: string
  fullName: string
  firstName: string
  imageUrl: string
  email: string
  lastSignInAt: Date | null
  createdAt: Date | null
}

const toClientUser = (user: User | null): SupabaseClientUser | null => {
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
    email,
    lastSignInAt: user.last_sign_in_at ? new Date(user.last_sign_in_at) : null,
    createdAt: user.created_at ? new Date(user.created_at) : null,
  }
}

export function useSupabaseUser() {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [user, setUser] = useState<SupabaseClientUser | null>(null)
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

export function useSupabaseAuth() {
  const { isLoaded, isSignedIn, user } = useSupabaseUser()

  return {
    isLoaded,
    isSignedIn,
    userId: user?.id ?? null,
  }
}

export function SignOutButton({ children }: { children?: ReactNode; [key: string]: unknown }) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])

  return (
    <button onClick={() => supabase.auth.signOut()} type="button">
      {children || "Salir"}
    </button>
  )
}
