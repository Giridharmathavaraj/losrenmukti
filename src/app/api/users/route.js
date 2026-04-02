import { connectToDatabase } from '@/lib/mongoose';
import User from '@/lib/models/User';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    let query = {};
    if (authUser.role === 'admin') {
      query.companyId = authUser.companyId;
    } else if (authUser.role === 'users') {
      return NextResponse.json({ error: 'Access denied.' }, { status: 403 });
    }

    const users = await User.find(query).select('-password').populate('companyId', 'name');
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
