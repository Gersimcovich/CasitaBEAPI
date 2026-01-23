import { NextResponse } from 'next/server';
import {
  verifyCode,
  getUserByEmail,
  createUser,
  createSession,
} from '@/lib/auth';
import { VerifyCodeRequest, AuthResponse, Locale } from '@/types/user';

interface VerifyRequestWithRegistration extends VerifyCodeRequest {
  // For new registrations
  firstName?: string;
  lastName?: string;
  phone?: string;
  country?: string;
  preferredLanguage?: Locale;
}

export async function POST(request: Request) {
  try {
    const body: VerifyRequestWithRegistration = await request.json();
    const { email, code, firstName, lastName, phone, country, preferredLanguage } = body;

    if (!email || !code) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Email and code are required' },
        { status: 400 }
      );
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Invalid code format. Please enter 6 digits.' },
        { status: 400 }
      );
    }

    // Verify the code
    const verification = verifyCode(email, code);

    if (!verification.valid) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: verification.error || 'Invalid code' },
        { status: 400 }
      );
    }

    // Get or create user
    let user = getUserByEmail(email);

    if (!user) {
      // This is a new registration
      if (!firstName || !lastName) {
        return NextResponse.json<AuthResponse>(
          { success: false, message: 'First name and last name are required for registration' },
          { status: 400 }
        );
      }

      user = createUser({
        email,
        firstName,
        lastName,
        phone,
        country,
        preferredLanguage: preferredLanguage || 'en',
      });
    }

    // Create session
    const session = createSession(user.id);

    // Return success with user data and token
    const response = NextResponse.json<AuthResponse>({
      success: true,
      message: 'Login successful',
      user,
      token: session.token,
    });

    // Set HTTP-only cookie for the token
    response.cookies.set('casita-auth-token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json<AuthResponse>(
      { success: false, message: 'An error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
