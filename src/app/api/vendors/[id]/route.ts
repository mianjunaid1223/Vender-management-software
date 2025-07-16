import { NextRequest, NextResponse } from 'next/server';
import { updateVendor, deleteVendor } from '@/lib/data';
import { Vendor } from '@/lib/types';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
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
  { params }: { params: { id: string } }
) {
  try {
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
