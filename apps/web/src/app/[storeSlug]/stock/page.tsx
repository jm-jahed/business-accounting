import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { InventoryWorkspace } from '../../../components/inventory/InventoryWorkspace';

export default async function StockPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/stock">
      <InventoryWorkspace storeSlug={storeSlug} />
    </StoreWorkspace>
  );
}
