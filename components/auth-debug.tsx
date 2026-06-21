"use client"
import { useUser } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { User, Mail, Calendar, Shield } from "lucide-react"

export default function AuthDebug() {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return (
      <Card className="border border-border bg-card shadow-sm">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-transparent" />
            <p className="text-sm text-muted-foreground">Cargando información del usuario...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!user) {
    return (
      <Card className="border border-destructive/40 bg-destructive/10">
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-destructive" />
            <p className="text-destructive">No hay usuario autenticado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border border-accent/30 bg-accent/10">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-accent-foreground">
          <Shield className="h-5 w-5" />
          <span>Sesión Activa</span>
          <Badge className="border border-accent/30 bg-background text-foreground">Autenticado</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center space-x-3 rounded-lg border border-border bg-background p-3">
            <User className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Nombre completo</p>
              <p className="font-semibold text-foreground">{user.fullName || "No disponible"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border border-border bg-background p-3">
            <Mail className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Email principal</p>
              <p className="font-semibold text-foreground">{user.primaryEmailAddress?.emailAddress || "No disponible"}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border border-border bg-background p-3">
            <Calendar className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">Último acceso</p>
              <p className="font-semibold text-foreground">
                {user.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("es-ES") : "Primer acceso"}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-3 rounded-lg border border-border bg-background p-3">
            <Shield className="h-5 w-5 text-accent" />
            <div>
              <p className="text-xs text-muted-foreground">ID de usuario</p>
              <p className="font-mono text-xs text-foreground break-all">{user.id}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
