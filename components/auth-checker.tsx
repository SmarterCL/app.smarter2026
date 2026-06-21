"use client"

import { useUser } from "@/lib/client-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import AuthForm from "@/components/auth-form"

export default function AuthChecker() {
  const { user, isLoaded } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (isLoaded && user) {
      router.push("/dashboard")
    }
  }, [user, isLoaded, router])

  if (!isLoaded) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    )
  }

  if (user) {
    return (
      <div className="text-center py-8">
        <p className="text-white">Redirigiendo al dashboard...</p>
      </div>
    )
  }

  return <AuthForm />
}
