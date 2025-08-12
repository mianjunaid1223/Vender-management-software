import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { ObjectId } from 'mongodb';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string; messageId: string }> }
) {
  try {
    const { vendorId, messageId } = await params;
    
    if (!vendorId || !ObjectId.isValid(vendorId) || !messageId || !ObjectId.isValid(messageId)) {
      return NextResponse.json(
        { error: 'Invalid vendor ID or message ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { error: 'Content is required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    // Check if vendor exists
    const vendor = await db.collection('vendors').findOne({
      _id: new ObjectId(vendorId)
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'Vendor not found' },
        { status: 404 }
      );
    }

    // Check if message exists
    const message = await db.collection('vendorMessages').findOne({
      _id: new ObjectId(messageId),
      vendorId: new ObjectId(vendorId)
    });

    if (!message) {
      return NextResponse.json(
        { error: 'Message not found' },
        { status: 404 }
      );
    }

    // Create reply
    const reply = {
      content,
      fromCompany: false, // Reply from vendor
      fromName: vendor.name,
      timestamp: new Date()
    };

    // Add reply to message
    const result = await db.collection('vendorMessages').updateOne(
      { _id: new ObjectId(messageId) },
      { 
        $push: { replies: reply } as any,
        $set: { updatedAt: new Date() }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to add reply' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Reply sent successfully'
    });
  } catch (error) {
    console.error('Error sending reply:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
