import { Suspense } from 'react';
import SignupClient from '@/components/SignupClient';

export const metadata = {
  title: 'Create Account — AMMIGE',
  description: 'Create your AMMIGE account for order history, faster checkout and new-drop alerts.',
};

export default function SignupPage() {
  return (
    <Suspense>
      <SignupClient />
    </Suspense>
  );
}
