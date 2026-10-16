import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function BuySuppliersPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/buy/suppliers">
      <ComingSoon storeSlug={storeSlug} path="/buy/suppliers" />
    </StoreWorkspace>
  );
}
