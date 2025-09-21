import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeContract } from '@/lib/data/vendor-data';
import { getVendorSession } from '@/lib/auth/vendor-auth';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { acknowledged, notes } = body;

    if (typeof acknowledged !== 'boolean') {
      return NextResponse.json({ error: 'Acknowledged field is required' }, { status: 400 });
    }

    const acknowledgment = {
      acknowledged,
      acknowledgedAt: new Date().toISOString(),
      acknowledgedBy: session.id,
      notes: typeof notes === 'string' ? notes.slice(0, 2000) : ''
    };

    await acknowledgeContract(
      params.id,
      session.vendorId,
      session.companyId,
      acknowledgment
    );

    return NextResponse.json({ 
      success: true, 
      message: 'Contract acknowledgment recorded' 
    });
  } catch (error) {
    console.error('Error acknowledging contract:', error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
