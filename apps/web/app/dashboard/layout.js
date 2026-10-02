import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }) {
  if (!(await getUser())) redirect('/login');
  return children;
}
