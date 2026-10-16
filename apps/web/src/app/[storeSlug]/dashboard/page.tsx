import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';

export default async function DashboardPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return <StoreWorkspace storeSlug={storeSlug} activePath="/dashboard" />;
}
