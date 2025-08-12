import { NextRequest, NextResponse } from 'next/server';
import { updateContract, deleteContract } from '@/lib/database/queries';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const contract = await updateContract(params.id, body);
    const serializedContract = JSON.parse(JSON.stringify(contract));
    return NextResponse.json(serializedContract);
  } catch (error) {
    console.error('Error updating contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update contract';
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
    await deleteContract(params.id);
    return NextResponse.json({ message: 'Contract deleted successfully' });
  } catch (error) {
    console.error('Error deleting contract:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete contract';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
