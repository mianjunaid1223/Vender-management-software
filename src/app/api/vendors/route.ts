import { NextResponse } from 'next/server';
import { fetchVendors } from '@/lib/database/queries';

export async function GET() {
  try {
    const vendors = await fetchVendors();
    return NextResponse.json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    return NextResponse.json(
      { error: 'Failed to fetch vendors' },
      { status: 500 }
    );
  }
}
