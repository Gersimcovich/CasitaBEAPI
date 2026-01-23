import { NextResponse } from 'next/server';

interface PartnerFormData {
  name: string;
  email: string;
  phone?: string;
  propertyType?: string;
  location: string;
  units?: string;
  message?: string;
}

export async function POST(request: Request) {
  try {
    const data: PartnerFormData = await request.json();

    // Validate required fields
    if (!data.name || !data.email || !data.location) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Format the email content
    const emailSubject = `New Partner Inquiry from ${data.name}`;
    const emailBody = `
New Partner Inquiry

Name: ${data.name}
Email: ${data.email}
Phone: ${data.phone || 'Not provided'}
Property Type: ${data.propertyType === 'vacation' ? 'Vacation Rental' : data.propertyType === 'hotel' ? 'Hotel' : 'Not specified'}
Location: ${data.location}
Number of Units: ${data.units || 'Not specified'}

Message:
${data.message || 'No message provided'}

---
Submitted from hellocasita.com partner page
    `.trim();

    // Send email using a simple fetch to a mail service
    // For production, you'd use a service like SendGrid, Resend, or AWS SES
    // For now, we'll use the Resend API if available, or fall back to logging

    const resendApiKey = process.env.RESEND_API_KEY;

    if (resendApiKey) {
      // Send via Resend
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'Casita Website <noreply@hellocasita.com>',
          to: ['info@hellocasita.com'],
          reply_to: data.email,
          subject: emailSubject,
          text: emailBody,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Resend API error:', error);
        // Still return success to user, log error for debugging
      }
    } else {
      // No email service configured - log to console for development
      console.log('=== NEW PARTNER INQUIRY ===');
      console.log('To: info@hellocasita.com');
      console.log('Subject:', emailSubject);
      console.log('Body:', emailBody);
      console.log('===========================');

      // In production without Resend, you could also:
      // 1. Store in database for later review
      // 2. Send via SMTP using nodemailer
      // 3. Use another email service
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! We will contact you within 24 hours.',
    });
  } catch (error) {
    console.error('Partner form error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit form. Please try again.' },
      { status: 500 }
    );
  }
}
