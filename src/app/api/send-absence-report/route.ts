import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // 1. Verify CRON_SECRET for security
  // Vercel sends the CRON_SECRET in the Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Allow testing if we are in local development
    if (process.env.NODE_ENV === 'production') {
      return new NextResponse('Unauthorized', { status: 401 });
    }
  }

  try {
    // 2. Fetch today's absence data from Supabase
    // Get date in Sri Lanka timezone
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Colombo' });
    
    // Fetch absences (excluding maternity to match UI rules)
    const { data: attendance, error } = await supabase
      .from('attendance')
      .select('status, category')
      .eq('date', today)
      .eq('status', 'Absent');

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Filter out maternity just like the main dashboard
    const absenceCount = attendance?.filter(a => a.category !== 'Maternity').length || 0;

    // 3. Setup Nodemailer
    const transporter = nodemailer.createTransport({
      host: 'smtp.office365.com',
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // 4. Send Email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'LahiruDIss@masholdings.com',
      subject: `Daily Absence Report - Matrix Attendance (${today})`,
      text: `Good morning,\n\nThe total number of absentees for today (${today}) is: ${absenceCount}.\n\nBest regards,\nMatrix Attendance System`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 8px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px;">Matrix Attendance - Daily Report</h2>
          <p style="font-size: 16px;">Good morning,</p>
          <p style="font-size: 16px;">The total number of recorded absentees for today (<strong>${today}</strong>) is:</p>
          
          <div style="background-color: ${absenceCount > 0 ? '#fee2e2' : '#dcfce7'}; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 48px; font-weight: bold; color: ${absenceCount > 0 ? '#ef4444' : '#22c55e'};">
              ${absenceCount}
            </span>
          </div>
          
          <p style="margin-top: 30px; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px;">
            This is an automated message from the Matrix Attendance System.<br>
            Sent via Vercel Cron Jobs.
          </p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Message sent: %s', info.messageId);

    return NextResponse.json({ success: true, absenceCount, messageId: info.messageId });
  } catch (error: any) {
    console.error('Error sending email:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
