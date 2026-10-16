import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { TeamView } from '../../../../components/TabViews';

export default async function SettingsTeamPermissionsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/settings/team-permissions">
      <TeamView />
    </StoreWorkspace>
  );
}
