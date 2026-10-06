import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { getDb } from '@/lib/db';
import VerifyGate from '@/components/VerifyGate';
import { DashboardTheme } from '@/components/ThemeToggle';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  const user = await getUser();
  if (!user) redirect('/login');
  // Accounts that haven't confirmed their email only see this screen.
  if (!user.emailVerified) {
    const db = await getDb();
    const full = await db.users.findById(user.id);
    return <><DashboardTheme /><VerifyGate email={user.email} pendingSlug={full?.pendingSlug || ''} /></>;
  }
  return <><DashboardTheme />{children}</>;
}
