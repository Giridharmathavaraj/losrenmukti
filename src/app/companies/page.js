'use client';

import Companies from '@/Component/Companies/Companies';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <Companies />
    </ProtectedRoute>
  );
}
