import { connectToDatabase } from '@/lib/mongoose';
import Loan from '@/lib/models/Loan';
import Company from '@/lib/models/Company';
import { authenticateToken } from '@/lib/auth';
import { NextResponse } from 'next/server';

export async function GET(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    let query = {};
    const isMainAdmin = authUser.username === 'owner';

    if (!isMainAdmin && authUser.companyId) {
      query.companyId = authUser.companyId;
    } else if (!isMainAdmin && !authUser.companyId) {
      return NextResponse.json([]);
    }

    const loans = await Loan.find(query).populate({ path: 'companyId', select: 'name', model: Company });
    return NextResponse.json(loans);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const formData = await request.formData();
    const loanData = {};

    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        loanData[key] = value;
      }
    }

    if (authUser.companyId) {
      loanData.companyId = authUser.companyId;
    }

    if (loanData.noOfIndividual) loanData.noOfIndividual = Number(loanData.noOfIndividual);
    if (loanData.Request_Loan_Amount) loanData.Request_Loan_Amount = Number(loanData.Request_Loan_Amount);
    if (loanData.rentAmount) loanData.rentAmount = Number(loanData.rentAmount);

    loanData.checkBox = loanData.checkBox === 'true';
    loanData.potentialBorrower = loanData.potentialBorrower === 'true';

    loanData.documents = {};
    const fileKeys = ['driversLicense', 'payStub1', 'payStub2', 'bankStatement1', 'bankStatement2'];
    
    for (const key of fileKeys) {
      const file = formData.get(key);
      if (file && file.size > 0) { // instance File
        loanData.documents[key] = {
          data: Buffer.from(await file.arrayBuffer()),
          contentType: file.type
        };
      }
    }

    const newLoan = new Loan(loanData);
    const savedLoan = await newLoan.save();

    const responseData = savedLoan.toObject();
    if (responseData.documents) {
      Object.keys(responseData.documents).forEach(k => {
        if (responseData.documents[k]) responseData.documents[k].data = undefined;
      });
    }

    return NextResponse.json({
      message: "Full application (including documents) saved!",
      data: responseData
    }, { status: 201 });
  } catch (error) {
    console.error('Error saving loan:', error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
