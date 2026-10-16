import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function SettingsBackupDataPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/settings/backup-data">
      <ComingSoon storeSlug={storeSlug} path="/settings/backup-data" />
    </StoreWorkspace>
  );
}
