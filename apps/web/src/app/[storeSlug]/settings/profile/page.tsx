import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { SettingsView } from '../../../../components/TabViews';

export default async function SettingsProfilePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/settings/profile">
      <SettingsView />
    </StoreWorkspace>
  );
}
