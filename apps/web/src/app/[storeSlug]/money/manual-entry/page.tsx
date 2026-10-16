import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function MoneyManualEntryPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/money/manual-entry">
      <ComingSoon storeSlug={storeSlug} path="/money/manual-entry" />
    </StoreWorkspace>
  );
}
