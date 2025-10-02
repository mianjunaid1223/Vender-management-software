import { NextRequest, NextResponse } from 'next/server';
import { getVendorInvoice, updateVendorInvoiceStatus } from '@/features/vendor-portal/lib/vendor-data';
import { getVendorSession } from '@/core/auth/vendor-auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic ObjectId validation
    if (!/^[a-f\d]{24}$/i.test(params.id)) {
      return NextResponse.json({ error: 'Invalid invoice id' }, { status: 400 });
    }

    const invoice = await getVendorInvoice(params.id, session.vendorId, session.companyId);
    
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Error fetching vendor invoice:', error);
    const msg = error instanceof Error ? error.message : '';
    if (msg === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (msg === 'Invoice not found') {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getVendorSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Basic ObjectId validation
    if (!/^[a-f\d]{24}$/i.test(params.id)) {
      return NextResponse.json({ error: 'Invalid invoice id' }, { status: 400 });
    }

    const body = await request.json();
    const { status, notes } = body;

    if (!status) {
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    await updateVendorInvoiceStatus(
      params.id,
      session.vendorId,
      session.companyId,
      status,
      notes
    );

    return NextResponse.json({ success: true, message: 'Invoice status updated' });
  } catch (error) {
    console.error('Error updating vendor invoice status:', error);

    const msg = error instanceof Error ? error.message : '';
    if (msg === 'Unauthorized') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (msg === 'Invoice not found') return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    if (msg === 'Invalid status update') return NextResponse.json({ error: msg }, { status: 400 });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
