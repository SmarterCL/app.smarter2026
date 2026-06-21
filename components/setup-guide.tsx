import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ExternalLink, Key, Database, Shield } from "lucide-react"

export default function SetupGuide() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 text-center">
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Setup Supabase Auth</h1>
          <p className="text-xl text-gray-600">Configure Supabase as the single identity provider.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-green-600" />
              Supabase Auth Setup
            </CardTitle>
            <CardDescription>Configure email/password or Google OAuth in Supabase.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {[
                "Create or open the Supabase project.",
                "Enable Email or Google OAuth in Authentication providers.",
                "Use /auth/callback as the OAuth callback route.",
                "Copy the project URL, publishable key, and service role key.",
              ].map((step, index) => (
                <div className="flex items-center gap-2" key={step}>
                  <Badge variant="outline" className="flex h-6 w-6 items-center justify-center rounded-full p-0 text-xs">
                    {index + 1}
                  </Badge>
                  <span className="text-sm">{step}</span>
                </div>
              ))}
            </div>

            <Separator />

            <div className="rounded-lg bg-gray-50 p-3">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Key className="h-4 w-4" />
                Environment Variables
              </h4>
              <div className="space-y-1 text-xs font-mono">
                <div>NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321</div>
                <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=...</div>
                <div>SUPABASE_SERVICE_ROLE_KEY=...</div>
              </div>
            </div>

            <div className="rounded-lg bg-green-50 p-3">
              <h4 className="mb-2 flex items-center gap-2 text-sm font-semibold">
                <Database className="h-4 w-4" />
                Local Tools
              </h4>
              <p className="text-sm text-gray-600">
                Supabase Studio runs at{" "}
                <a
                  className="inline-flex items-center gap-1 text-green-700 hover:underline"
                  href="http://127.0.0.1:54323"
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  http://127.0.0.1:54323 <ExternalLink className="h-3 w-3" />
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
