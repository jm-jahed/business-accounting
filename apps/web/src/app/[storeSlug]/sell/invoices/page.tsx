import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function SellInvoicesPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/sell/invoices">
      <ComingSoon storeSlug={storeSlug} path="/sell/invoices" />
    </StoreWorkspace>
  );
}
