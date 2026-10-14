import { redirect, notFound } from 'next/navigation';
import { COMPANY_SLUG_REGEX, RESERVED_COMPANY_SLUGS } from '@accounting/contracts';

interface PageProps {
  params: Promise<{
    storeSlug: string;
  }>;
}

export default async function StoreRootRedirect({ params }: PageProps) {
  const { storeSlug } = await params;

  const normalizedSlug = storeSlug?.trim().toLowerCase();
  if (
    !normalizedSlug ||
    !COMPANY_SLUG_REGEX.test(normalizedSlug) ||
    RESERVED_COMPANY_SLUGS.includes(normalizedSlug as any)
  ) {
    notFound();
  }

  // Canonical store route always lands on dashboard
  redirect(`/${normalizedSlug}/dashboard`);
}
