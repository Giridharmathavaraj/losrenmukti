'use client';

import EditUserPage from '@/Component/EditUserPage';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <EditUserPage />
    </ProtectedRoute>
  );
}
