import { connectToDatabase } from '@/lib/mongoose';
import State from '@/lib/models/State';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { states } = await request.json();
    const companyId = authUser.companyId || null;

    if (!Array.isArray(states)) return NextResponse.json({ error: 'Expected an array of states' }, { status: 400 });

    const addedStates = [];
    const errors = [];

    for (const s of states) {
      if (!s.name || !s.code) continue;
      try {
        const existing = await State.findOne({
          $or: [{ name: s.name.trim() }, { code: s.code.trim().toUpperCase() }],
          companyId
        });

        if (!existing) {
          const newState = new State({
            name: s.name.trim(),
            code: s.code.trim().toUpperCase(),
            interestRate: Number(s.interestRate) || 0,
            originationFees: Number(s.originationFees) || 0,
            minLoanAmount: Number(s.minLoanAmount) || 0,
            maxLoanAmount: Number(s.maxLoanAmount) || 0,
            status: s.status === 'Approved' ? 'Approved' : 'Pending',
            companyId
          });
          await newState.save();
          addedStates.push(newState);
        }
      } catch (err) {
        errors.push(`Failed to import ${s.name}: ${err.message}`);
      }
    }

    return NextResponse.json({ importedCount: addedStates.length, addedStates, errors }, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
