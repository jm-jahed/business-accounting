import React from 'react';
import { StoreWorkspace } from '../../../components/StoreWorkspace';
import { ComingSoon } from '../../../components/ComingSoon';

export default async function TasksPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/tasks">
      <ComingSoon storeSlug={storeSlug} path="/tasks" />
    </StoreWorkspace>
  );
}
