'use client';

import AddCompany from '@/Component/Companies/AddCompany';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <AddCompany />
    </ProtectedRoute>
  );
}
