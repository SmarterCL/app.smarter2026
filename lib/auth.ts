import { createServerSupabaseClient } from "@/lib/supabase-server"

export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    return null
  }

  return user
}

export async function requireUser() {
  const user = await getCurrentUser()

  if (!user) {
    throw new Error("UNAUTHORIZED")
  }

  return user
}

export async function auth() {
  const user = await getCurrentUser()

  return {
    user,
    userId: user?.id ?? null,
    sessionId: null,
  }
}

