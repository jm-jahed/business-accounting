import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function CounterSaleSellPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/counter-sale/sell">
      <ComingSoon storeSlug={storeSlug} path="/counter-sale/sell" />
    </StoreWorkspace>
  );
}
