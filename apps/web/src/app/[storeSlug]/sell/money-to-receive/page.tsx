import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function SellMoneyToReceivePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/sell/money-to-receive">
      <ComingSoon storeSlug={storeSlug} path="/sell/money-to-receive" />
    </StoreWorkspace>
  );
}
