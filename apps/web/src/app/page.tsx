import { redirect } from 'next/navigation';

export default function RootPage() {
  // Direct unauthenticated visitors to canonical login route
  redirect('/login');
}
