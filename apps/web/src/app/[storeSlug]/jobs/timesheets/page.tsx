import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function JobsTimesheetsPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/jobs/timesheets">
      <ComingSoon storeSlug={storeSlug} path="/jobs/timesheets" />
    </StoreWorkspace>
  );
}
