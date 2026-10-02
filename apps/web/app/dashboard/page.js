import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { config } from '@/lib/config';
import { toDashboardPage } from '@/lib/pages';
import PagesList from '@/components/PagesList';

export const metadata = { title: 'My pages — Otrelink' };

export default async function DashboardHome() {
  const user = await getUser();
  const db = await getDb();
  const pages = (await db.pages.listByUser(user.id)).map(toDashboardPage);
  return <PagesList user={user} pages={pages} pageUrl={config.pageUrl} limit={config.pagesPerUser} />;
}
