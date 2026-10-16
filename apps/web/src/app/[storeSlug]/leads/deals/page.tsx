import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function LeadsDealsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/leads/deals">
      <ComingSoon storeSlug={storeSlug} path="/leads/deals" />
    </StoreWorkspace>
  );
}
