import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { ChartOfAccountsView } from '../../../components/TabViews';

export default async function MoneyPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/money">
      <ChartOfAccountsView storeSlug={storeSlug} />
    </StoreWorkspace>
  );
}
