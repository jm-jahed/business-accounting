import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { ComingSoon } from '../../../components/ComingSoon';

export default async function LeadsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/leads">
      <ComingSoon storeSlug={storeSlug} path="/leads" />
    </StoreWorkspace>
  );
}
