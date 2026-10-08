#!/usr/bin/env node
// Otrelink MCP server over stdio (Claude Desktop, Claude Code, Cursor…).
//
//   OTRELINK_URL=https://your-otrelink.com OTRELINK_TOKEN=otl_… node packages/mcp/src/index.js
//
// stdout is the MCP channel: log only to stderr.
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createOtrelinkServer } from './server.js';
import { createClient } from './client.js';

try {
  const client = createClient({ baseUrl: process.env.OTRELINK_URL, token: process.env.OTRELINK_TOKEN });
  const server = createOtrelinkServer({ client });
  await server.connect(new StdioServerTransport());
  console.error(`[otrelink-mcp] connected to ${client.baseUrl}`);
} catch (err) {
  console.error(`[otrelink-mcp] ${err.message}`);
  process.exit(1);
}
