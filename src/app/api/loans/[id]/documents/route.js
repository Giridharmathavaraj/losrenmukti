import { connectToDatabase } from '@/lib/mongoose';
import Loan from '@/lib/models/Loan';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function PATCH(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { id } = await params;
    const loan = await Loan.findById(id);

    if (!loan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 404 });
    }

    if (!loan.documents) loan.documents = {};

    const formData = await request.formData();
    let updatedDocs = false;
    const fileKeys = ['driversLicense', 'payStub1', 'payStub2', 'bankStatement1', 'bankStatement2'];

    for (const key of fileKeys) {
      const file = formData.get(key);
      if (file && file.size > 0) {
        loan.documents[key] = {
          data: Buffer.from(await file.arrayBuffer()),
          contentType: file.type
        };
        updatedDocs = true;
      }
    }

    if (updatedDocs) {
      if (!loan.comments) loan.comments = [];
      loan.comments.push({
        updatedBy: authUser.username || 'System',
        updatedAt: new Date(),
        message: 'Loan documents uploaded/updated'
      });
      await loan.save();
    }

    const updatedLoan = loan.toObject();
    if (updatedLoan.documents) {
      Object.keys(updatedLoan.documents).forEach(k => {
        if (updatedLoan.documents[k]) updatedLoan.documents[k].data = undefined;
      });
    }

    return NextResponse.json({
      message: "Documents updated successfully!",
      documents: updatedLoan.documents
    });
  } catch (error) {
    console.error('Error updating documents:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
