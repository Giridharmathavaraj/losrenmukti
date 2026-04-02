import { connectToDatabase } from '@/lib/mongoose';
import Company from '@/lib/models/Company';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function POST(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied. No token provided.' }, { status: 401 });

  if (authUser.role !== 'superadmin') {
    return NextResponse.json({ error: 'Only Superadmins can create companies.' }, { status: 403 });
  }

  try {
    await connectToDatabase();
    const { name, contactEmail, status } = await request.json();

    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return NextResponse.json({ error: 'Company with this name already exists' }, { status: 400 });
    }

    const newCompany = new Company({ name, contactEmail, status });
    await newCompany.save();
    return NextResponse.json(newCompany, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied. No token provided.' }, { status: 401 });

  try {
    await connectToDatabase();
    if (authUser.role === 'superadmin') {
      const companies = await Company.find().sort({ createdAt: -1 });
      return NextResponse.json(companies);
    } else {
      if (!authUser.companyId) return NextResponse.json([]);
      const company = await Company.findById(authUser.companyId);
      return NextResponse.json(company ? [company] : []);
    }
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
