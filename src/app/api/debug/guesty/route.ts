import { NextResponse } from 'next/server';

const BEAPI_AUTH_URL = 'https://booking.guesty.com/oauth2/token';
const OPEN_API_AUTH_URL = 'https://open-api.guesty.com/oauth2/token';

export async function GET() {
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      beapi_client_id: process.env.GUESTY_BEAPI_CLIENT_ID ? 'SET' : 'NOT SET',
      beapi_client_secret: process.env.GUESTY_BEAPI_CLIENT_SECRET ? 'SET' : 'NOT SET',
      open_api_client_id: process.env.GUESTY_CLIENT_ID ? 'SET' : 'NOT SET',
      open_api_client_secret: process.env.GUESTY_CLIENT_SECRET ? 'SET' : 'NOT SET',
    },
    beapi_token: null as string | null,
    open_api_token: null as string | null,
  };

  // Test BEAPI token
  if (process.env.GUESTY_BEAPI_CLIENT_ID && process.env.GUESTY_BEAPI_CLIENT_SECRET) {
    try {
      const response = await fetch(BEAPI_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.GUESTY_BEAPI_CLIENT_ID,
          client_secret: process.env.GUESTY_BEAPI_CLIENT_SECRET,
          scope: 'booking_engine:api',
        }),
      });

      if (response.ok) {
        results.beapi_token = 'SUCCESS';
      } else {
        const error = await response.text();
        results.beapi_token = `ERROR ${response.status}: ${error}`;
      }
    } catch (e) {
      results.beapi_token = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  // Test Open API token
  if (process.env.GUESTY_CLIENT_ID && process.env.GUESTY_CLIENT_SECRET) {
    try {
      const response = await fetch(OPEN_API_AUTH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          grant_type: 'client_credentials',
          client_id: process.env.GUESTY_CLIENT_ID,
          client_secret: process.env.GUESTY_CLIENT_SECRET,
          scope: 'open-api',
        }),
      });

      if (response.ok) {
        results.open_api_token = 'SUCCESS';
      } else {
        const error = await response.text();
        results.open_api_token = `ERROR ${response.status}: ${error}`;
      }
    } catch (e) {
      results.open_api_token = `EXCEPTION: ${e instanceof Error ? e.message : String(e)}`;
    }
  }

  return NextResponse.json(results);
}
