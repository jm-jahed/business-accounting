import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function StockAdjustmentPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/stock/adjustment">
      <ComingSoon storeSlug={storeSlug} path="/stock/adjustment" />
    </StoreWorkspace>
  );
}
