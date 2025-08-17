import { NextRequest, NextResponse } from 'next/server';
import { updateVendor, deleteVendor } from '@/lib/database/queries';
import { Vendor } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  context: any
) {
  try {
    const body = await request.json();
    const { params } = context;
    const vendor: Partial<Vendor> = body;
    const updatedVendor = await updateVendor(params.id, vendor);
    return NextResponse.json(updatedVendor);
  } catch (error) {
    console.error('Error updating vendor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update vendor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: any
) {
  try {
    const { params } = context;
    await deleteVendor(params.id);
    return NextResponse.json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete vendor';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
