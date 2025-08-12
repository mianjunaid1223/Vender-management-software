import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { ObjectId } from 'mongodb';

export async function PUT(
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

    const db = await getDb();
    
    // Check if message exists and belongs to vendor
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

    // Mark message as read
    const result = await db.collection('vendorMessages').updateOne(
      { _id: new ObjectId(messageId) },
      { 
        $set: { 
          read: true,
          readAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to mark message as read' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Message marked as read'
    });
  } catch (error) {
    console.error('Error marking message as read:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
