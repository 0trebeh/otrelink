import { headers } from 'next/headers';
import { getUser } from '@/lib/auth';
import { publicOrigin } from '@/lib/origin';
import { TOKEN_ROUTES, TOKEN_EXPIRY_DAYS, TOKEN_RATE_LIMIT, MAX_TOKENS } from '@/lib/tokens';
import ApiTokensPage from '@/components/ApiTokensPage';

export const metadata = { title: 'API tokens — Otrelink' };

export default async function ApiTokens() {
  const user = await getUser();
  const origin = publicOrigin({ headers: await headers(), url: 'http://localhost' });
  return (
    <ApiTokensPage
      user={user}
      origin={origin}
      routes={TOKEN_ROUTES.map((r) => r.label)}
      expiryDays={TOKEN_EXPIRY_DAYS}
      rateLimit={TOKEN_RATE_LIMIT}
      max={MAX_TOKENS}
    />
  );
}
