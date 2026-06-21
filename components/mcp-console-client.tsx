'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PlayIcon, Copy, CheckIcon } from 'lucide-react'

type QuickAction = {
  label: string
  tool: string
  args?: string
}

const QUICK_ACTIONS: QuickAction[] = [
  { label: 'List Tenants', tool: 'tenants.list', args: '{}' },
  { label: 'Get Tenant', tool: 'tenants.get', args: '{"id":"TENANT_UUID"}' },
  { label: 'Create Tenant', tool: 'tenants.create', args: '{"rut":"12.345.678-9","businessName":"Demo Corp"}' },
  { label: 'Update Services', tool: 'tenants.updateServices', args: '{"id":"TENANT_UUID","services":{"crm":true,"bot":false}}' },
]

type Props = {
  mcpEnabled: boolean
}

export default function McpConsoleClient({ mcpEnabled }: Props) {
  const [toolName, setToolName] = useState('tenants.list')
  const [argsJson, setArgsJson] = useState('{}')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)

  async function executeTool() {
    if (!mcpEnabled) {
      setResult({ ok: false, error: 'mcp_disabled', message: 'MCP not enabled' })
      return
    }
    setLoading(true)
    setResult(null)
    try {
      let parsedArgs = {}
      if (argsJson.trim()) {
        parsedArgs = JSON.parse(argsJson)
      }
      const res = await fetch('/api/mcp/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ name: toolName, args: parsedArgs }),
      })
      const data = await res.json()
      setResult(data)
    } catch (err: any) {
      setResult({ ok: false, error: 'client_error', message: err.message })
    } finally {
      setLoading(false)
    }
  }

  function loadQuickAction(action: QuickAction) {
    setToolName(action.tool)
    setArgsJson(action.args || '{}')
  }

  function copyResult() {
    navigator.clipboard.writeText(JSON.stringify(result, null, 2))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left panel - Executor */}
      <Card className="p-6 space-y-4 lg:col-span-2">
        <div>
          <label className="text-sm font-medium mb-2 block">Tool Name</label>
          <Input
            value={toolName}
            onChange={(e) => setToolName(e.target.value)}
            placeholder="tenants.list"
            className="font-mono"
          />
        </div>
        <div>
          <label className="text-sm font-medium mb-2 block">Arguments (JSON)</label>
          <Textarea
            value={argsJson}
            onChange={(e) => setArgsJson(e.target.value)}
            placeholder='{"id":"uuid"}'
            className="font-mono h-32"
          />
        </div>
        <Button onClick={executeTool} disabled={loading || !mcpEnabled} className="w-full">
          <PlayIcon className="w-4 h-4 mr-2" />
          {loading ? 'Executing...' : 'Execute Tool'}
        </Button>

        {result && (
          <div className="mt-6 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Result</label>
              <Button variant="ghost" size="sm" onClick={copyResult}>
                {copied ? <CheckIcon className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
            <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-96">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </Card>

      {/* Right panel - Quick Actions */}
      <Card className="p-6 space-y-4">
        <h3 className="font-semibold">Quick Actions</h3>
        <div className="space-y-2">
          {QUICK_ACTIONS.map((action, idx) => (
            <Button
              key={idx}
              variant="outline"
              size="sm"
              onClick={() => loadQuickAction(action)}
              className="w-full justify-start"
            >
              {action.label}
            </Button>
          ))}
        </div>
        <div className="pt-4 border-t text-xs text-muted-foreground space-y-1">
          <p><strong>Available Tools:</strong></p>
          <ul className="list-disc list-inside space-y-0.5 font-mono text-[10px]">
            <li>tenants.list</li>
            <li>tenants.get</li>
            <li>tenants.create</li>
            <li>tenants.updateServices</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
