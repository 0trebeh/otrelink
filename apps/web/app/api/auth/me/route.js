import { handler, json, requireUser } from '@/lib/http';

export const GET = handler(async () => json({ user: await requireUser() }));
