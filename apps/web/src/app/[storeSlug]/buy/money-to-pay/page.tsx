import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function BuyMoneyToPayPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/buy/money-to-pay">
      <ComingSoon storeSlug={storeSlug} path="/buy/money-to-pay" />
    </StoreWorkspace>
  );
}
