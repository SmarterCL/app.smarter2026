"use client"

import { useState } from "react"
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable"
import { ConversationList } from "./ConversationList"
import { MessageThread } from "./MessageThread"
import { HermesPanel } from "./HermesPanel"
import { WahaQrConnector } from "./WahaQrConnector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Settings, LogOut, Bell, QrCode } from "lucide-react"
import { useSupabaseUser, SignOutButton } from "@/lib/supabase-auth-client"
import Link from "next/link"
import type { WorkspaceBootstrapTenant } from "@/lib/workspace-bootstrap-client"

type WahaStatus = "connected" | "pending" | "disconnected" | "unknown"

export function WorkspaceLayout({ tenant }: { tenant: WorkspaceBootstrapTenant }) {
  const { user } = useSupabaseUser()
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [selectedContactId, setSelectedContactId] = useState<number | null>(null)
  const [wahaStatus, setWahaStatus] = useState<WahaStatus>("unknown")
  const [showQrModal, setShowQrModal] = useState(false)

  const handleConversationSelect = (conversationId: number, contactId?: number) => {
    setSelectedConversationId(conversationId)
    if (contactId) setSelectedContactId(contactId)
  }

  const tenantId = tenant.tenant_id
  const tenantName = tenant.business_name || tenant.name || tenant.tenant_id

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="flex items-center justify-between border-b px-4 py-2">
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="rounded-lg px-3 py-1 text-sm font-semibold">
            SmarterOS Console
          </Badge>
          <WahaStatusIndicator status={wahaStatus} onShowQr={() => setShowQrModal(true)} />
          {tenantName && (
            <Badge variant="secondary" className="rounded-lg px-3 py-1 text-xs">
              {tenantName}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="gap-2">
            <Bell className="h-4 w-4" />
          </Button>
          <Link href="/settings">
            <Button variant="ghost" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
            </Button>
          </Link>
          <SignOutButton>
            <Button variant="ghost" size="sm" className="gap-2">
              <LogOut className="h-4 w-4" />
            </Button>
          </SignOutButton>
          {user && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {user.firstName || user.email}
            </span>
          )}
        </div>
      </header>

      {showQrModal && (
        <WahaQrConnector
          tenantId={tenantId}
          onStatusChange={setWahaStatus}
          onConnected={() => setShowQrModal(false)}
          onOpenChange={setShowQrModal}
        />
      )}

      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
          <ConversationList
            selectedId={selectedConversationId}
            onSelect={handleConversationSelect}
            wahaStatus={wahaStatus}
            onConnectWaha={() => setShowQrModal(true)}
            tenantId={tenantId}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={48} minSize={35}>
          <MessageThread
            conversationId={selectedConversationId}
            onContactSelect={(contactId) => setSelectedContactId(contactId)}
          />
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize={27} minSize={20} maxSize={40}>
          <HermesPanel
            conversationId={selectedConversationId}
            contactId={selectedContactId}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}

function WahaStatusIndicator({
  status,
  onShowQr,
}: {
  status: WahaStatus
  onShowQr: () => void
}) {
  const statusConfig = {
    connected: { label: "Canal activo", color: "bg-emerald-500", textColor: "text-emerald-700", bg: "bg-emerald-500/10" },
    pending: { label: "Canal en espera", color: "bg-yellow-500", textColor: "text-yellow-700", bg: "bg-yellow-500/10" },
    disconnected: { label: "Canal detenido", color: "bg-red-500", textColor: "text-red-700", bg: "bg-red-500/10" },
    unknown: { label: "Sin validar", color: "bg-gray-400", textColor: "text-gray-700", bg: "bg-gray-500/10" },
  }

  const config = statusConfig[status]

  return (
    <button
      onClick={status !== "connected" ? onShowQr : undefined}
      className={`flex items-center gap-2 rounded-lg px-2 py-1 ${config.bg} ${status !== "connected" ? "cursor-pointer hover:opacity-80" : ""}`}
    >
      <div className={`h-2 w-2 rounded-full ${config.color}`} />
      <span className={`text-xs font-medium ${config.textColor}`}>{config.label}</span>
      {status !== "connected" && <QrCode className={`h-3 w-3 ${config.textColor}`} />}
    </button>
  )
}
