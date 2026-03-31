'use client';

import LoanDashboard from '@/Component/LoanDashboard';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <LoanDashboard />
    </ProtectedRoute>
  );
}
