'use client';

import ParticularLoanPage from '@/Component/ParticularLoanPage';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <ParticularLoanPage />
    </ProtectedRoute>
  );
}
