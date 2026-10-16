import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function MoneyCashBankPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/money/cash-bank">
      <ComingSoon storeSlug={storeSlug} path="/money/cash-bank" />
    </StoreWorkspace>
  );
}
