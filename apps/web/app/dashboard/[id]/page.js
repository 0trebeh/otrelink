import { notFound } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import { config } from '@/lib/config';
import { toDashboardPage } from '@/lib/pages';
import Editor from '@/components/editor/Editor';

export const metadata = { title: 'Editor — Otrelink' };

export default async function EditorPage({ params }) {
  const { id } = await params;
  const user = await getUser();
  const db = await getDb();
  const page = await db.pages.findById(id);
  if (!page || page.userId !== user.id) notFound();
  return <Editor initialPage={toDashboardPage(page)} pageUrl={config.pageUrl} plan={user.plan} />;
}
