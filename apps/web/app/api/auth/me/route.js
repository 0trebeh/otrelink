import { handler, json, requireUser } from '@/lib/http';
import { config } from '@/lib/config';

// pageUrl = where public pages live (pageUrl/slug), used by API clients like the MCP server.
export const GET = handler(async () => json({ user: await requireUser(), pageUrl: config.pageUrl }));
