import { NextResponse } from 'next/server';

const OPEN_API_AUTH_URL = 'https://open-api.guesty.com/oauth2/token';
const OPEN_API_URL = 'https://open-api.guesty.com/v1';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const listingId = searchParams.get('listingId') || '67043d97fad97f00122b6da7';
  const from = searchParams.get('from') || '2026-02-01';
  const to = searchParams.get('to') || '2026-02-10';

  try {
    // Get token
    const tokenResponse = await fetch(OPEN_API_AUTH_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.GUESTY_CLIENT_ID || '',
        client_secret: process.env.GUESTY_CLIENT_SECRET || '',
        scope: 'open-api',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      return NextResponse.json({ error: `Token error: ${error}` }, { status: 500 });
    }

    const tokenData = await tokenResponse.json();
    const token = tokenData.access_token;

    // Fetch raw calendar data
    const calendarUrl = `${OPEN_API_URL}/availability-pricing/api/calendar/listings/${listingId}?startDate=${from}&endDate=${to}`;

    const calendarResponse = await fetch(calendarUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!calendarResponse.ok) {
      const error = await calendarResponse.text();
      return NextResponse.json({ error: `Calendar error: ${error}` }, { status: 500 });
    }

    const rawData = await calendarResponse.json();

    // Return raw response for inspection
    return NextResponse.json({
      listingId,
      from,
      to,
      rawResponse: rawData,
      sampleDays: rawData.data?.days?.slice(0, 5),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 500 });
  }
}
