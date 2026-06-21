'use client'

import { useState } from "react"

import { cn } from "@/lib/utils"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

type ThemeName = "theme-light" | "theme-bw"

const STORAGE_KEY = "smarteros-theme"
const DEFAULT_THEME: ThemeName = "theme-light"
const THEME_CLASSES: ThemeName[] = ["theme-light", "theme-bw"]

function readInitialTheme(): ThemeName {
  if (typeof window === "undefined") {
    return DEFAULT_THEME
  }

  const root = document.documentElement
  const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeName | null

  if (stored && THEME_CLASSES.includes(stored)) {
    return stored
  }

  const fromDataset = root.dataset.theme as ThemeName | undefined
  if (fromDataset && THEME_CLASSES.includes(fromDataset)) {
    return fromDataset
  }

  return root.classList.contains("theme-bw") ? "theme-bw" : DEFAULT_THEME
}

function updateRootTheme(theme: ThemeName) {
  const root = document.documentElement
  THEME_CLASSES.forEach((name) => root.classList.remove(name))
  root.classList.add(theme)
  root.dataset.theme = theme
}

export default function ThemeToggle({ className }: { className?: string }) {
  const isClient = typeof window !== "undefined"
  const [theme, setTheme] = useState<ThemeName>(() => readInitialTheme())

  if (!isClient) {
    return null
  }

  const handleChange = (checked: boolean) => {
    const nextTheme = checked ? "theme-bw" : DEFAULT_THEME
    setTheme(nextTheme)
    updateRootTheme(nextTheme)
    window.localStorage.setItem(STORAGE_KEY, nextTheme)
  }

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-full border border-border bg-secondary/70 px-3 py-2 text-xs backdrop-blur",
        className
      )}
    >
      <span className="font-medium uppercase tracking-[0.2em] text-muted-foreground">Color</span>
      <Switch
        id="theme-toggle"
        checked={theme === "theme-bw"}
        onCheckedChange={handleChange}
        aria-label="Cambiar tema de color"
      />
      <Label htmlFor="theme-toggle" className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground">
        {theme === "theme-bw" ? "B/N" : "Claro"}
      </Label>
    </div>
  )
}
