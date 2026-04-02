import { connectToDatabase } from '@/lib/mongoose';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const authUser = authenticateToken(request);
    if (!authUser) return NextResponse.json({ error: 'Access denied. No token provided.' }, { status: 401 });

    await connectToDatabase();
    let { username, password, role, status, companyId } = await request.json();

    if (authUser.role === 'admin') {
      companyId = authUser.companyId;
    } else if (authUser.role === 'users') {
      return NextResponse.json({ error: 'Standard users cannot create other users.' }, { status: 403 });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = new User({
      username,
      password: hashedPassword,
      role: role || 'users',
      status: status || 'enable',
      companyId: companyId || null
    });

    await newUser.save();
    return NextResponse.json({ message: 'User registered successfully!' }, { status: 201 });
  } catch (error) {
    console.error('Error during registration:', error);
    return NextResponse.json({ error: 'Internal server error during registration' }, { status: 500 });
  }
}
