import { Suspense } from 'react';
import LoginClient from '@/components/LoginClient';

export const metadata = {
  title: 'Log In — AMMIGE',
  description: 'Log in to your AMMIGE account to track orders and check out faster.',
};

export default function LoginPage() {
  return (
    <Suspense>
      <LoginClient />
    </Suspense>
  );
}
