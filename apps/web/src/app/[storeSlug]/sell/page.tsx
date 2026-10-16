import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { SalesWorkspace } from '../../../components/sales/SalesWorkspace';

export default async function SellPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/sell">
      <SalesWorkspace storeSlug={storeSlug} />
    </StoreWorkspace>
  );
}

