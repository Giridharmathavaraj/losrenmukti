'use client';

import StateSettings from '@/Component/Settings/StateSettings';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <StateSettings />
    </ProtectedRoute>
  );
}
