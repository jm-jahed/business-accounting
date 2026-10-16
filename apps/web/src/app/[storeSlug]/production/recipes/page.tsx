import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function ProductionRecipesPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/production/recipes">
      <ComingSoon storeSlug={storeSlug} path="/production/recipes" />
    </StoreWorkspace>
  );
}
