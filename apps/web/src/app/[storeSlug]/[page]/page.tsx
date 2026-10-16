import React from 'react';
import { notFound } from 'next/navigation';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { COMPANY_SLUG_REGEX, RESERVED_COMPANY_SLUGS } from '@accounting/contracts';

interface PageProps {
  params: Promise<{
    storeSlug: string;
    page: string;
  }>;
}

const VALID_CANONICAL_PAGES = new Set([
  'dashboard',
  'sales',
  'purchases',
  'accounts',
  'reports',
  'settings',
  'team',
  'coa',
  'ledger',
  'bills',
  'banking',
  'inventory',
]);

export default async function StoreCanonicalPage({ params }: PageProps) {
  const { storeSlug, page } = await params;

  // 1. Strict validation of store slug
  const normalizedSlug = storeSlug?.trim().toLowerCase();
  if (
    !normalizedSlug ||
    !COMPANY_SLUG_REGEX.test(normalizedSlug) ||
    RESERVED_COMPANY_SLUGS.includes(normalizedSlug as any)
  ) {
    notFound();
  }

  // 2. Strict validation of subpage route
  const normalizedPage = page?.trim().toLowerCase();
  if (!VALID_CANONICAL_PAGES.has(normalizedPage)) {
    notFound();
  }

  return <StoreWorkspace storeSlug={normalizedSlug} initialPage={normalizedPage} />;
}
