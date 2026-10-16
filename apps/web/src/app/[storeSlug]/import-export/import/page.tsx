import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function ImportExportImportPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/import-export/import">
      <ComingSoon storeSlug={storeSlug} path="/import-export/import" />
    </StoreWorkspace>
  );
}
