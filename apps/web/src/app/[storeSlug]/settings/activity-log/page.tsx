import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function SettingsActivityLogPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/settings/activity-log">
      <ComingSoon storeSlug={storeSlug} path="/settings/activity-log" />
    </StoreWorkspace>
  );
}
