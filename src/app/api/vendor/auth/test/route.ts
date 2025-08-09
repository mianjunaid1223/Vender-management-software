import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Vendor auth API is working', timestamp: new Date().toISOString() });
}

export async function POST() {
  return NextResponse.json({ message: 'POST method is available', timestamp: new Date().toISOString() });
}
