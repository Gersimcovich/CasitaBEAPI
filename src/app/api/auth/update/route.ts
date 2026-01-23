import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSessionByToken, getUserById, updateUser } from '@/lib/auth';
import { UpdateUserRequest } from '@/types/user';

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('casita-auth-token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = getSessionByToken(token);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Session expired' },
        { status: 401 }
      );
    }

    const user = getUserById(session.userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User not found' },
        { status: 404 }
      );
    }

    const body: UpdateUserRequest = await request.json();
    const { firstName, lastName, phone, country, preferredLanguage } = body;

    // Build update object with only provided fields
    const updates: Partial<typeof user> = {};
    if (firstName !== undefined) updates.firstName = firstName;
    if (lastName !== undefined) updates.lastName = lastName;
    if (phone !== undefined) updates.phone = phone;
    if (country !== undefined) updates.country = country;
    if (preferredLanguage !== undefined) updates.preferredLanguage = preferredLanguage;

    const updatedUser = updateUser(user.id, updates);

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: 'Failed to update user' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
