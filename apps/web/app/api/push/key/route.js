import { config } from '@/lib/config';
import { handler, json } from '@/lib/http';

// Public VAPID key the browser needs to subscribe to push notifications.
export const GET = handler(async () => json({ publicKey: config.vapidPublicKey || null }));
