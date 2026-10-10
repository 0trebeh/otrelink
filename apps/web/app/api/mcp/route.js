// Remote MCP server (Streamable HTTP), so AI assistants can use Otrelink from
// any device: add it in claude.ai → Customize → Connectors → Add custom connector
//   URL:            https://YOUR-APP/api/mcp
//   Request header: Authorization: Bearer otl_…   (Dashboard → API, Business plan)
// Same tools as packages/mcp (stdio). Stateless: every request builds its own
// server, so it works with several instances and survives restarts.
// The tools call this same app's API with the caller's token (so plan limits,
// read-only tokens and the per-token rate limit all apply as usual).
import { WebStandardStreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js';
import { createOtrelinkServer, createClient } from '@otrelink/mcp';
import { getUser } from '@/lib/auth';
import { bearerToken } from '@/lib/tokens';
import { publicOrigin } from '@/lib/origin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/** Where the tools reach the API: this same server, without leaving the machine. */
const internalBase = () => process.env.MCP_INTERNAL_URL || `http://127.0.0.1:${process.env.PORT || 3000}`;

const MESSAGES = {
  unauthorized: 'Send your Otrelink API token: Authorization: Bearer otl_… (Dashboard → API).',
  invalid_token: 'The API token is not valid.',
  token_expired: 'The API token expired. Create a new one in Otrelink → API.',
  api_not_in_plan: 'API access is part of the Business plan (or it was turned off for this account).',
  too_many_requests: 'Too many requests (120 per minute per token).',
};

/** JSON-RPC error, so MCP clients show the reason. */
function refuse(status, code) {
  return Response.json(
    { jsonrpc: '2.0', error: { code: -32001, message: MESSAGES[code] || code, data: { error: code } }, id: null },
    { status, headers: status === 401 ? { 'WWW-Authenticate': 'Bearer realm="otrelink"' } : {} },
  );
}

async function handle(req) {
  const token = bearerToken(req.headers.get('authorization'));
  if (!token) return refuse(401, 'unauthorized');
  let user;
  try {
    user = await getUser();
  } catch (err) {
    if (!err?.status) throw err;
    return refuse(err.status, err.code || 'unauthorized');
  }
  if (!user || user.auth?.type !== 'token') return refuse(401, 'unauthorized');

  // Internal calls carry the public address (so uploaded files get public URLs)
  // and the visitor's IP (so per-IP limits still see the real caller).
  const origin = new URL(publicOrigin(req));
  const forwarded = {
    'x-forwarded-host': origin.host,
    'x-forwarded-proto': origin.protocol.replace(':', ''),
    'x-forwarded-for': (req.headers.get('x-forwarded-for') || '').split(',')[0].trim(),
  };
  for (const k of Object.keys(forwarded)) if (!forwarded[k]) delete forwarded[k];
  const fetchWith = (url, init = {}) => fetch(url, { ...init, headers: { ...init.headers, ...forwarded } });
  const client = createClient({ baseUrl: internalBase(), token, fetch: fetchWith });
  const server = createOtrelinkServer({ client, remote: true });
  const transport = new WebStandardStreamableHTTPServerTransport({ sessionIdGenerator: undefined, enableJsonResponse: true });
  try {
    await server.connect(transport);
    return await transport.handleRequest(req);
  } finally {
    // JSON responses are complete here; nothing stays open between requests.
    server.close().catch(() => {});
  }
}

export const POST = handle;
export const GET = handle;
export const DELETE = handle;
