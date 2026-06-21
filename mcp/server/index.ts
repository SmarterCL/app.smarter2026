import { Server } from '@modelcontextprotocol/sdk/server';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';
import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { tenantTools } from '../tools/supabase-tenants';
import { fastapiTools } from '../tools/fastapi-proxy';

const ENABLED = process.env.MCP_ENABLED === 'true';

// Minimal MCP server scaffold. Will register tools in future phases.

async function main() {
  if (!ENABLED) {
    // eslint-disable-next-line no-console
    console.log('[MCP] Disabled (set MCP_ENABLED=true to activate)');
    return;
  }

  const server = new Server({ name: 'smarterbot-mcp', version: '0.0.1' });
  const tools: Tool[] = [
    {
      name: 'tenants.list',
      description: 'List active tenants for the authenticated Supabase user',
      inputSchema: { type: 'object', properties: {}, additionalProperties: false },
    },
    {
      name: 'tenants.get',
      description: 'Get a tenant by UUID (must belong to authenticated user)',
      inputSchema: {
        type: 'object',
        properties: { id: { type: 'string', description: 'Tenant UUID' } },
        required: ['id'],
        additionalProperties: false,
      },
    },
    {
      name: 'tenants.create',
      description: 'Create a new tenant (rut, businessName)',
      inputSchema: {
        type: 'object',
        properties: {
          rut: { type: 'string' },
          businessName: { type: 'string' },
        },
        required: ['rut', 'businessName'],
        additionalProperties: false,
      },
    },
    {
      name: 'tenants.updateServices',
      description: 'Update tenant services_enabled flags',
      inputSchema: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          services: { type: 'object', additionalProperties: { type: 'boolean' } },
        },
        required: ['id', 'services'],
        additionalProperties: false,
      },
    },
    {
      name: 'fastapi.get',
      description: 'Call FastAPI backend GET endpoint',
      inputSchema: {
        type: 'object',
        properties: { path: { type: 'string' } },
        required: ['path'],
        additionalProperties: false,
      },
    },
    {
      name: 'fastapi.post',
      description: 'Call FastAPI backend POST endpoint',
      inputSchema: {
        type: 'object',
        properties: {
          path: { type: 'string' },
          body: { type: 'object' },
        },
        required: ['path'],
        additionalProperties: false,
      },
    },
    {
      name: 'services.provision',
      description: 'Provision services for a tenant',
      inputSchema: {
        type: 'object',
        properties: {
          tenantId: { type: 'string' },
          services: { type: 'array', items: { type: 'string' } },
        },
        required: ['tenantId', 'services'],
        additionalProperties: false,
      },
    },
    {
      name: 'services.status',
      description: 'Get services status for a tenant',
      inputSchema: {
        type: 'object',
        properties: { tenantId: { type: 'string' } },
        required: ['tenantId'],
        additionalProperties: false,
      },
    },
  ];
  server.setTools(tools);
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // eslint-disable-next-line no-console
  console.log('[MCP] Server started: smarterbot-mcp v0.0.1');
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[MCP] Fatal error', err);
  process.exit(1);
});
