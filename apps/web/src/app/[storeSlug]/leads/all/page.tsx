import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function LeadsAllPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/leads/all">
      <ComingSoon storeSlug={storeSlug} path="/leads/all" />
    </StoreWorkspace>
  );
}
