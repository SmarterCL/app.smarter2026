"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Database, Shield, ArrowRight } from "lucide-react"

export default function DemoModeToggle() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [currentUser, setCurrentUser] = useState<string | null>(null)

  const demoUsers = [
    { id: "demo-1", name: "John Doe", email: "john@demo.com", role: "Admin" },
    { id: "demo-2", name: "Jane Smith", email: "jane@demo.com", role: "User" },
    { id: "demo-3", name: "Mike Johnson", email: "mike@demo.com", role: "Manager" },
  ]

  const handleDemoLogin = (user: (typeof demoUsers)[0]) => {
    setCurrentUser(user.name)
    setIsLoggedIn(true)
    // Simulate login delay
    setTimeout(() => {
      window.location.href = "/demo-dashboard"
    }, 1000)
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setCurrentUser(null)
  }

  if (isLoggedIn) {
    return (
      <Card className="mx-auto w-full max-w-md border border-border bg-card shadow-sm">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-accent/30 bg-accent/10 text-accent">
            <Shield className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">Iniciando sesión como {currentUser}...</h3>
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-border border-t-transparent" />
          <p className="text-sm text-muted-foreground">Redirigiendo al panel principal...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card className="border border-border bg-card shadow-sm">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-foreground">
            <Database className="h-5 w-5 text-accent" />
            Sistema de autenticación demo
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Prueba todo el sistema de autenticación sin configurar nada
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-secondary p-4">
              <h4 className="mb-2 font-semibold text-foreground">¿Qué incluye?</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• CRUD completo sobre todas las tablas</li>
                <li>• Gestión de perfiles de usuario</li>
                <li>• Administración de contactos</li>
                <li>• Manejo de API Keys</li>
                <li>• Control de códigos QR</li>
                <li>• Diseño responsivo</li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-semibold text-foreground">Elige un usuario demo:</h4>
              {demoUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between rounded-lg border border-border bg-background p-3 transition-colors hover:bg-secondary"
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{user.name}</p>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="secondary" className="border border-border bg-secondary text-muted-foreground">
                      {user.role}
                    </Badge>
                    <Button
                      size="sm"
                      onClick={() => handleDemoLogin(user)}
                      className="flex items-center gap-1 bg-accent text-accent-foreground hover:bg-accent/90"
                    >
                      Entrar <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-secondary p-4">
              <h4 className="mb-2 font-semibold text-foreground">Nota:</h4>
              <p className="text-sm text-muted-foreground">
                Este es un modo demo. No se realiza autenticación real y los cambios de datos son temporales. Para usar
                autenticación real con Google OAuth, configura Supabase Auth.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
