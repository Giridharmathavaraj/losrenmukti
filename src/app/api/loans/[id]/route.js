import { connectToDatabase } from '@/lib/mongoose';
import Loan from '@/lib/models/Loan';
import { authenticateToken } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

let emailTransporter;
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  emailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
}

export async function GET(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { id } = await params;
    const loan = await Loan.findById(id);

    if (!loan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 404 });
    }

    return NextResponse.json(loan);
  } catch (error) {
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { id } = await params;
    const updatedData = await request.json();

    const updateComment = {
      updatedBy: authUser.username || 'System',
      updatedAt: new Date(),
      message: 'Loan details and configuration updated'
    };

    delete updatedData.comments;

    const originalLoan = await Loan.findById(id);
    const updatedLoan = await Loan.findByIdAndUpdate(
      id,
      {
        ...updatedData,
        $push: { comments: updateComment }
      },
      { new: true }
    );

    if (!updatedLoan) {
      return NextResponse.json({ message: "Loan not found" }, { status: 404 });
    }

    let mailSent = false;
    if (updatedLoan && originalLoan) {
      if (updatedData.transactions || updatedData.completedPayments) {
        if (emailTransporter && updatedLoan.email) {
          mailSent = true;
          const subject = "Alert: Your Loan Payment Date was Updated";
          const text = `Dear ${updatedLoan.firstName},\n\nA payment date on your transaction schedule was recently modified.\nPlease log in to your portal to review the updated schedule.\n\nThank you,\nLOS Team`;
          emailTransporter.sendMail({
            from: `"LOS Updates" <${process.env.EMAIL_USER || 'no-reply@test.com'}>`,
            to: updatedLoan.email,
            subject, text
          }).then(async () => {
            await Loan.findByIdAndUpdate(id, { $push: { emails: { sentBy: 'System', sentAt: new Date(), subject, message: text, recipient: updatedLoan.email } } });
          }).catch(console.error);
        }
      }
      if (updatedData.bankingDetails) {
        if (emailTransporter && updatedLoan.email) {
          mailSent = true;
          const subject = "Alert: Your Bank Details were Updated";
          const text = `Dear ${updatedLoan.firstName},\n\nThe banking details for ${updatedData.bankingDetails.accountType || 'your account'} were successfully updated.\n\nThank you,\nLOS Security`;
          emailTransporter.sendMail({
            from: `"LOS Security" <${process.env.EMAIL_USER || 'no-reply@test.com'}>`,
            to: updatedLoan.email,
            subject, text
          }).then(async () => {
            await Loan.findByIdAndUpdate(id, { $push: { emails: { sentBy: 'System', sentAt: new Date(), subject, message: text, recipient: updatedLoan.email } } });
          }).catch(console.error);
        }
      }
    }

    return NextResponse.json({ ...updatedLoan.toObject(), mailSent });
  } catch (error) {
    console.error("Update Loan Error:", error); 
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
