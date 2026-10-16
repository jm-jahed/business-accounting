import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function ReportsBooksCheckPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/reports/books-check">
      <ComingSoon storeSlug={storeSlug} path="/reports/books-check" />
    </StoreWorkspace>
  );
}
