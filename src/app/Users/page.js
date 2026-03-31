'use client';

import Users from '@/Component/New Users/Users';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <Users />
    </ProtectedRoute>
  );
}
