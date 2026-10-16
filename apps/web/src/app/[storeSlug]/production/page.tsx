import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { ComingSoon } from '../../../components/ComingSoon';

export default async function ProductionPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/production">
      <ComingSoon storeSlug={storeSlug} path="/production" />
    </StoreWorkspace>
  );
}
