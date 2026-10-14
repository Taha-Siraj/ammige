import AccountClient from '@/components/AccountClient';

export const metadata = {
  title: 'My Account — AMMIGE',
  description: 'Your AMMIGE account — order history and details.',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return <AccountClient />;
}
