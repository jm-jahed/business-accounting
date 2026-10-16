import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function SettingsPlanBillingPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/settings/plan-billing">
      <ComingSoon storeSlug={storeSlug} path="/settings/plan-billing" />
    </StoreWorkspace>
  );
}
