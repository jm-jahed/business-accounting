import React from 'react';
import { StoreWorkspace } from '../../../../components/StoreWorkspace';
import { ComingSoon } from '../../../../components/ComingSoon';

export default async function StaffAttendancePage({ params }: { params: Promise<{ storeSlug: string }> }) {
  const { storeSlug } = await params;
  return (
    <StoreWorkspace storeSlug={storeSlug} activePath="/staff/attendance">
      <ComingSoon storeSlug={storeSlug} path="/staff/attendance" />
    </StoreWorkspace>
  );
}
