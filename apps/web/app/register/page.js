import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { config } from '@/lib/config';
import AuthForm from '@/components/AuthForm';

export const metadata = { title: 'Create your page — Otrelink' };

export default async function RegisterPage() {
  if (await getUser()) redirect('/dashboard');
  return <AuthForm mode="register" pageUrl={config.pageUrl} />;
}
