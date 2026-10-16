import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { ComingSoon } from '../../../components/ComingSoon';

export default async function SellPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/sell">
      <ComingSoon storeSlug={storeSlug} path="/sell" />
    </StoreWorkspace>
  );
}
