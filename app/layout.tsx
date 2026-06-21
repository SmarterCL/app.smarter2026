import type React from "react"
import Script from "next/script"

import "./globals.css"

const baseBodyClass = "font-sans antialiased"

const themeInitScript = `
;(function () {
  var STORAGE_KEY = 'smarteros-theme';
  var DEFAULT_THEME = 'theme-light';
  var THEMES = ['theme-light', 'theme-bw'];
  var root = document.documentElement;
  try {
    var stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && THEMES.indexOf(stored) !== -1) {
      THEMES.forEach(function (name) {
        root.classList.remove(name);
      });
      root.classList.add(stored);
      root.dataset.theme = stored;
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, DEFAULT_THEME);
    if (!root.classList.contains(DEFAULT_THEME)) {
      root.classList.add(DEFAULT_THEME);
    }
    root.dataset.theme = DEFAULT_THEME;
  } catch (error) {
    if (root && !root.dataset.theme) {
      root.dataset.theme = DEFAULT_THEME;
    }
  }
})();
`

export const metadata = {
  title: "SmarterOS Hub",
  description: "Gestion de automatizaciones y datos para SmarterOS",
  generator: "smarteros-workspace",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" className="theme-light" data-theme="theme-light" suppressHydrationWarning>
      <body className={baseBodyClass}>
        <Script id="smarteros-theme-init" strategy="beforeInteractive">
          {themeInitScript}
        </Script>
        {children}
      </body>
    </html>
  )
}
