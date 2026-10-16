import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function MoneyTaxVatPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/money/tax-vat">
      <ComingSoon storeSlug={storeSlug} path="/money/tax-vat" />
    </StoreWorkspace>
  );
}
