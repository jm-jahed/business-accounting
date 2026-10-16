import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function BuyMoneyPaidPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/buy/money-paid">
      <ComingSoon storeSlug={storeSlug} path="/buy/money-paid" />
    </StoreWorkspace>
  );
}
