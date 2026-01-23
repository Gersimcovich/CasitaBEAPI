import { NextResponse } from 'next/server';
import { getUserByEmail, createVerificationCode } from '@/lib/auth';
import { send2FACodeEmail } from '@/lib/email';
import { RegisterRequest, AuthResponse, Locale } from '@/types/user';

export async function POST(request: Request) {
  try {
    const body: RegisterRequest = await request.json();
    const { email, firstName, lastName, phone, country, preferredLanguage } = body;

    // Validate required fields
    if (!email || !firstName || !lastName) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Email, first name, and last name are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = getUserByEmail(email);
    if (existingUser) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'An account with this email already exists. Please log in.' },
        { status: 400 }
      );
    }

    // Create verification code (we'll store registration data temporarily)
    const verificationCode = createVerificationCode(email, 'register');

    // Store registration data in the session (we'll create the user after verification)
    // For now, we'll pass the data through the verification process
    const language: Locale = preferredLanguage || 'en';

    // Send the code via email
    const emailResult = await send2FACodeEmail({
      email,
      code: verificationCode.code,
      name: firstName,
      language,
    });

    if (!emailResult.success) {
      console.error('Failed to send 2FA email:', emailResult.error);
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json<AuthResponse>({
      success: true,
      message: 'Verification code sent to your email',
      requiresVerification: true,
    });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
