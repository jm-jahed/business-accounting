import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function ReportsTaxSummaryPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/reports/tax-summary">
      <ComingSoon storeSlug={storeSlug} path="/reports/tax-summary" />
    </StoreWorkspace>
  );
}
