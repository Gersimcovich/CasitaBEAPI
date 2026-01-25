import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    beapi: {
      clientId: process.env.GUESTY_BEAPI_CLIENT_ID ? 'SET' : 'NOT SET',
      clientSecret: process.env.GUESTY_BEAPI_CLIENT_SECRET ? 'SET' : 'NOT SET',
    },
    openApi: {
      clientId: process.env.GUESTY_CLIENT_ID ? 'SET' : 'NOT SET',
      clientSecret: process.env.GUESTY_CLIENT_SECRET ? 'SET' : 'NOT SET',
    },
    fallbackOnly: process.env.GUESTY_USE_FALLBACK_ONLY,
  });
}
