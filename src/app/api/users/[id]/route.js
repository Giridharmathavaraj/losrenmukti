import { connectToDatabase } from '@/lib/mongoose';
import User from '@/lib/models/User';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    if (authUser.role === 'users') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    await connectToDatabase();
    const { id } = await params;
    let { role, status, companyId } = await request.json();

    if (authUser.role === 'admin') {
      companyId = authUser.companyId;
    }

    const updateData = { role, status };
    if (companyId !== undefined) {
      updateData.companyId = companyId === '' ? null : companyId;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    )
      .select('-password')
      .populate('companyId', 'name');

    if (!updatedUser) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Update User Error:", error); 
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
