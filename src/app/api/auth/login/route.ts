import { NextResponse } from 'next/server';
import { getUserByEmail, createVerificationCode } from '@/lib/auth';
import { send2FACodeEmail } from '@/lib/email';
import { LoginRequest, AuthResponse } from '@/types/user';

export async function POST(request: Request) {
  try {
    const body: LoginRequest = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Email is required' },
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

    // Check if user exists
    const existingUser = await getUserByEmail(email);

    if (!existingUser) {
      // User doesn't exist - needs to register
      return NextResponse.json<AuthResponse>({
        success: false,
        message: 'Account not found. Try creating an account.',
        requiresRegistration: true,
      });
    }

    // User exists - create and send verification code
    const verificationCode = await createVerificationCode(email, 'login');

    // Send the code via email
    const emailResult = await send2FACodeEmail({
      email: existingUser.email,
      code: verificationCode.code,
      name: existingUser.firstName,
      language: existingUser.preferredLanguage,
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
    console.error('Login error:', error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Login error details:', errorMessage);

    // Check if it's a MongoDB connection error
    if (errorMessage.includes('MONGODB_URI') || errorMessage.includes('MongoClient') || errorMessage.includes('connect')) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Database connection failed. Please try again.' },
        { status: 503 }
      );
    }

    // Check if it's a network/DNS error
    if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('getaddrinfo')) {
      return NextResponse.json<AuthResponse>(
        { success: false, message: 'Network error. Please check your connection.' },
        { status: 503 }
      );
    }

    return NextResponse.json<AuthResponse>(
      { success: false, message: `Login failed: ${errorMessage.slice(0, 100)}` },
      { status: 500 }
    );
  }
}
