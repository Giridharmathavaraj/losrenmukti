import { connectToDatabase } from '@/lib/mongoose';
import { NextResponse } from 'next/server';

export async function GET() {
  await connectToDatabase();
  return NextResponse.json({ status: 'ok', time: new Date().toISOString(), environment: process.env.NODE_ENV || 'development' });
}
