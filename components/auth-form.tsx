"use client"

import { SignInButton, SignUpButton } from "@/lib/client-auth"
import { Chrome, ArrowRight, ShieldCheck, Facebook } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"

export default function AuthForm() {
  return (
    <div className="space-y-4">
      <div className="space-y-4 rounded-3xl border border-border/70 bg-white/95 p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2 text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent">Crea tu cuenta</p>
            <h2 className="flex flex-wrap items-center gap-2 text-xl font-semibold text-foreground">
              <span>¡Bienvenido/a, estamos listos!</span>
              <span aria-hidden="true" className="text-2xl leading-none">
                👋
              </span>
            </h2>
            <p className="text-sm text-muted-foreground">
              ¡Completa los siguientes datos para comenzar a automatizar tu negocio con SmarterOS!
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <SignInButton mode="modal">
              <Button
                variant="outline"
                type="button"
                className="group flex h-10 w-full items-center justify-center gap-3 border border-border bg-secondary text-sm text-foreground transition-colors duration-300 hover:bg-emerald-500/10 hover:text-foreground sm:flex-1"
              >
                <Chrome className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
                Google
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </Button>
            </SignInButton>

            <SignInButton mode="modal">
              <Button
                variant="outline"
                type="button"
                className="group flex h-10 w-full items-center justify-center gap-3 border border-border bg-secondary text-sm text-foreground transition-colors duration-300 hover:bg-emerald-500/10 hover:text-foreground sm:flex-1"
              >
                <Facebook className="h-4 w-4 text-accent transition-transform group-hover:scale-110" />
                Facebook
                <ArrowRight className="ml-auto h-4 w-4 opacity-0 transition-all group-hover:translate-x-1 group-hover:opacity-100" />
              </Button>
            </SignInButton>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full bg-border" />
            </div>
            <div className="relative flex justify-center">
              <span className="rounded-full border border-border bg-background px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                o
              </span>
            </div>
          </div>

          <form className="space-y-3">
            <div className="space-y-2 text-left">
              <Label htmlFor="login-email">Correo electrónico</Label>
              <Input id="login-email" type="email" placeholder="nombre@empresa.com" autoComplete="email" />
            </div>
            <div className="space-y-2 text-left">
              <Label htmlFor="login-password">Contraseña</Label>
              <Input id="login-password" type="password" autoComplete="current-password" className="tracking-[0.35em]" />
              <p className="text-xs font-medium text-emerald-500">
                Tu contraseña cumple con todos los requisitos necesarios.
              </p>
            </div>
            <SignUpButton mode="modal">
              <Button
                type="button"
                className="group flex h-11 w-full items-center justify-center gap-2 bg-accent text-sm text-accent-foreground transition-transform duration-300 hover:-translate-y-0.5 hover:bg-accent/90"
              >
                Crear cuenta
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </SignUpButton>
          </form>

          <div className="space-y-3 text-center text-xs text-muted-foreground">
            <p>
              ¿Ya tienes una cuenta?
              {" "}
              <SignInButton mode="modal">
                <span className="cursor-pointer font-semibold text-foreground underline-offset-2 hover:underline">
                  Iniciar sesión
                </span>
              </SignInButton>
            </p>
            <p className="flex items-center justify-center gap-2 text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
              Autenticado por Supabase
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
