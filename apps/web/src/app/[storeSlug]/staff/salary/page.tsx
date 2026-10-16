import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function StaffSalaryPage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/staff/salary">
      <ComingSoon storeSlug={storeSlug} path="/staff/salary" />
    </StoreWorkspace>
  );
}
