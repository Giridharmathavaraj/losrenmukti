import { connectToDatabase } from '@/lib/mongoose';
import Company from '@/lib/models/Company';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PUT(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied. No token provided.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { id } = await params;
    
    const isMainAdmin = authUser.username === 'owner';
    if (!isMainAdmin && authUser.companyId !== id) {
      return NextResponse.json({ error: 'You do not have permission to edit this company.' }, { status: 403 });
    }

    const { name, contactEmail, status } = await request.json();
    const updatedCompany = await Company.findByIdAndUpdate(
      id,
      { name, contactEmail, status },
      { new: true }
    );

    if (!updatedCompany) {
      return NextResponse.json({ message: "Company not found" }, { status: 404 });
    }

    return NextResponse.json(updatedCompany);
  } catch (error) {
    console.error("Update Company Error:", error); 
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
