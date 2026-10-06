import { pushToUser, pushConfigured } from '@/lib/notify';
import { handler, json, error, requireUser, rateLimit } from '@/lib/http';

// Send a test notification to all of the user's devices.
export const POST = handler(async (req) => {
  await rateLimit(req, 'push-test', 10, 10 * 60 * 1000);
  const user = await requireUser();
  if (!pushConfigured()) return error(503, 'push_not_configured');
  const res = await pushToUser(user.id, { title: 'Otrelink', body: 'Notifications are working on this device 🎉', url: '/dashboard', tag: 'test' });
  return json(res);
});
