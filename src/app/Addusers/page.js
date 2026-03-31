'use client';

import RecordForm from '@/Component/New Users/Addusers';
import ProtectedRoute from '@/Component/ProtectedRoute';

export default function Page() {
  return (
    <ProtectedRoute>
      <RecordForm />
    </ProtectedRoute>
  );
}
