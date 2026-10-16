import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function ReportsAssetsDebtsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/reports/assets-debts">
      <ComingSoon storeSlug={storeSlug} path="/reports/assets-debts" />
    </StoreWorkspace>
  );
}
