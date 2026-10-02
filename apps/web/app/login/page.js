import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { config } from '@/lib/config';
import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Log in — Otrelink' };

export default async function LoginPage() {
  if (await getUser()) redirect('/dashboard');
  return <AuthForm mode="login" pageUrl={config.pageUrl} />;
}
