import { NextRequest, NextResponse } from 'next/server';

// Reservation lookup endpoint
// In production, this would connect to Guesty Open API to search reservations
export async function POST(request: NextRequest) {
  try {
    const { lastName, confirmationCode } = await request.json();

    if (!lastName || !confirmationCode) {
      return NextResponse.json(
        { success: false, error: 'Last name and confirmation code are required' },
        { status: 400 }
      );
    }

    // TODO: Implement actual Guesty Open API reservation lookup
    // For now, return a mock response for testing

    // In production, this would:
    // 1. Call GET /reservations with confirmationCode filter
    // 2. Verify the guest's last name matches
    // 3. Return the reservation details

    // Mock: return error for demo (real implementation would search Guesty)
    return NextResponse.json({
      success: false,
      error: 'Reservation not found. Please check your details and try again.',
    });

  } catch (error) {
    console.error('Reservation lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to look up reservation' },
      { status: 500 }
    );
  }
}
