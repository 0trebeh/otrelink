import { PLANS } from '@otrelink/core';
import { config } from '@/lib/config';
import { stripeConfigured } from '@/lib/billing/stripe';
import { paypalConfigured } from '@/lib/billing/paypal';
import { handler, json } from '@/lib/http';

// What the Plan page can offer.
export const GET = handler(async () => json({
  stripe: stripeConfigured(),
  paypal: paypalConfigured(),
  contactEmail: config.businessContactEmail,
  proPrice: PLANS.pro.price,
}));
