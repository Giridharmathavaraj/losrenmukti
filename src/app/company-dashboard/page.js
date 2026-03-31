'use client';

import CompanyDashboard from '@/Component/CompanyDashboard';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <CompanyDashboard />
    </ProtectedRoute>
  );
}
