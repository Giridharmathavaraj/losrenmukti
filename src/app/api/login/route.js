import { connectToDatabase } from '@/lib/mongoose';
import User from '@/lib/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here';

export async function POST(request) {
  try {
    await connectToDatabase();
    const { username, password } = await request.json();

    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    if (user.status === 'disable') {
      return NextResponse.json({ error: 'Account disabled. Please contact an administrator.' }, { status: 403 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
    }

    const payload = {
      userId: user._id,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1d' });

    return NextResponse.json({
      message: 'Login successful',
      token,
      username: user.username,
      role: user.role,
      companyId: user.companyId
    });
  } catch (error) {
    console.error('Error during login:', error);
    return NextResponse.json({ 
      error: 'Internal server error during login',
      detail: error.message 
    }, { status: 500 });
  }
}
