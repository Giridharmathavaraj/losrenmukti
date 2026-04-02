import { connectToDatabase } from '@/lib/mongoose';
import Loan from '@/lib/models/Loan';
import { authenticateToken } from '@/lib/auth';
import nodemailer from 'nodemailer';
import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const authUser = authenticateToken(request);
  if (!authUser) return NextResponse.json({ error: 'Access denied.' }, { status: 401 });

  try {
    await connectToDatabase();
    const { id } = await params;
    const { subject, message, recipient } = await request.json();

    const loan = await Loan.findById(id);
    if (!loan) return NextResponse.json({ message: "Loan not found" }, { status: 404 });

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      const emailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        }
      });

      await emailTransporter.sendMail({
        from: `"LOS Team" <${process.env.EMAIL_USER}>`,
        to: recipient || loan.email,
        subject: subject,
        text: message
      });

      const newEmailLog = {
        sentBy: authUser.username || 'System',
        sentAt: new Date(),
        subject,
        message,
        recipient: recipient || loan.email
      };

      const updatedLoan = await Loan.findByIdAndUpdate(id, { $push: { emails: newEmailLog } }, { new: true });
      return NextResponse.json(updatedLoan);
    } else {
      return NextResponse.json({ message: "Email transporter not configured" }, { status: 500 });
    }
  } catch (error) {
    console.error("Send Email Route Error:", error); 
    return NextResponse.json({ message: error.message }, { status: 400 });
  }
}
