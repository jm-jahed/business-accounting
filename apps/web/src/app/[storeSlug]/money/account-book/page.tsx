import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { GeneralLedgerOverview } from '../../../../components/GeneralLedgerOverview';

export default async function MoneyAccountBookPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/money/account-book">
      <GeneralLedgerOverview currency="AED" />
    </StoreWorkspace>
  );
}
