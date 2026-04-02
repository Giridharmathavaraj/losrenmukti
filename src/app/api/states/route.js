import { connectToDatabase } from '@/lib/mongoose';
import State from '@/lib/models/State';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    let query = {};
    if (authUser.companyId && authUser.role !== 'superadmin') {
      query.companyId = authUser.companyId;
    }
    const states = await State.find(query).sort({ name: 1 });
    return NextResponse.json(states);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { name, code, interestRate, originationFees, status, minLoanAmount, maxLoanAmount } = await request.json();
    let companyId = authUser.companyId || null;

    if (!name || !code) return NextResponse.json({ error: 'Name and Code are required' }, { status: 400 });

    const existingState = await State.findOne({ name: name.trim(), companyId: companyId });
    if (existingState) return NextResponse.json({ error: 'State with this name already exists' }, { status: 400 });

    const newState = new State({
      name: name.trim(),
      code: code.trim().toUpperCase(),
      interestRate: Number(interestRate) || 0,
      originationFees: Number(originationFees) || 0,
      minLoanAmount: Number(minLoanAmount) || 0,
      maxLoanAmount: Number(maxLoanAmount) || 0,
      status: status === 'Approved' ? 'Approved' : 'Pending',
      companyId
    });
    await newState.save();
    return NextResponse.json(newState, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
