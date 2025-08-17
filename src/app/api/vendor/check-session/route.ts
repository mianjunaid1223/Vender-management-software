import { NextResponse } from 'next/server';

export async function GET() {
  // Minimal stub used for type generation and basic health-checking of vendor session
  return NextResponse.json({ ok: true, session: null });
}
