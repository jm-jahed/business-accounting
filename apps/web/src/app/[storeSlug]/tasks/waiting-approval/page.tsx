import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function TasksWaitingApprovalPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/tasks/waiting-approval">
      <ComingSoon storeSlug={storeSlug} path="/tasks/waiting-approval" />
    </StoreWorkspace>
  );
}
