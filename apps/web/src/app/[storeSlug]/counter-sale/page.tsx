import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { ComingSoon } from '../../../components/ComingSoon';

export default async function CounterSalePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/counter-sale">
      <ComingSoon storeSlug={storeSlug} path="/counter-sale" />
    </StoreWorkspace>
  );
}
