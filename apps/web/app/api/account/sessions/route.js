import { getDb } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { handler, json, requireUser } from '@/lib/http';

// Sign out on every other device (phones, other browsers). This one stays signed in.
export const DELETE = handler(async () => {
  const user = await requireUser();
  const db = await getDb();
  const updated = await db.users.update(user.id, { sessionsValidAfter: new Date().toISOString() });
  await createSession(updated);
  return json({ ok: true });
});
