import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    
    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
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

    // Fetch messages for this vendor
    const messages = await db.collection('vendorMessages')
      .find({ vendorId: new ObjectId(vendorId) })
      .sort({ timestamp: -1 })
      .toArray();

    const formattedMessages = messages.map(msg => ({
      id: msg._id.toString(),
      subject: msg.subject,
      content: msg.content,
      fromCompany: msg.fromCompany,
      fromName: msg.fromName,
      timestamp: msg.timestamp,
      read: msg.read || false,
      priority: msg.priority || 'medium',
      attachments: msg.attachments || [],
      replies: msg.replies || []
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error('Error fetching vendor messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    
    if (!vendorId || !ObjectId.isValid(vendorId)) {
      return NextResponse.json(
        { error: 'Invalid vendor ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { subject, content, priority = 'medium' } = body;

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
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

    // Create new message
    const newMessage = {
      vendorId: new ObjectId(vendorId),
      subject,
      content,
      fromCompany: false, // Message from vendor
      fromName: vendor.name,
      timestamp: new Date(),
      read: false,
      priority,
      attachments: [],
      replies: []
    };

    const result = await db.collection('vendorMessages').insertOne(newMessage);

    return NextResponse.json({
      message: 'Message sent successfully',
      messageId: result.insertedId.toString()
    });
  } catch (error) {
    console.error('Error sending vendor message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
