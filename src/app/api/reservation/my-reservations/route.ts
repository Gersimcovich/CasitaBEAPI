import { NextResponse } from 'next/server';
import { getReservationsByEmail } from '@/lib/guesty';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 }
      );
    }

    const reservations = await getReservationsByEmail(email);

    // Map to a clean format for the frontend
    const mapped = reservations.map((r) => ({
      id: r._id,
      confirmationCode: r.confirmationCode,
      status: r.status === 'canceled' ? 'cancelled' : r.status,
      guestName: r.guest ? `${r.guest.firstName || ''} ${r.guest.lastName || ''}`.trim() : '',
      propertyName: r.listing?.title || r.listing?.nickname || 'Property',
      propertyImage: r.listing?.picture?.thumbnail || r.listing?.pictures?.[0]?.thumbnail || '',
      propertyAddress: r.listing?.address?.full || '',
      checkIn: r.checkInDateLocalized,
      checkOut: r.checkOutDateLocalized,
      guests: r.guestsCount || 1,
      totalPrice: r.money?.hostPayout || r.money?.totalPaid || 0,
      nightsCount: r.nightsCount || 0,
      canModify: r.status === 'confirmed' || r.status === 'reserved',
      canCancel: r.status === 'confirmed' || r.status === 'reserved',
    }));

    return NextResponse.json({
      success: true,
      reservations: mapped,
    });
  } catch (error) {
    console.error('Error fetching user reservations:', error);
    return NextResponse.json(
      { success: false, error: 'Unable to fetch reservations. Please try again.' },
      { status: 500 }
    );
  }
}
