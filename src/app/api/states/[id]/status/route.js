import { connectToDatabase } from '@/lib/mongoose';
import State from '@/lib/models/State';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { id } = await params;
    const { status } = await request.json();
    let query = { _id: id };
    
    if (authUser.companyId && authUser.role !== 'superadmin') {
      query.companyId = authUser.companyId;
    }

    if (!['Pending', 'Approved'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updatedState = await State.findOneAndUpdate(query, { status }, { new: true });
    if (!updatedState) return NextResponse.json({ error: 'State not found or unauthorized' }, { status: 404 });

    return NextResponse.json(updatedState);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
