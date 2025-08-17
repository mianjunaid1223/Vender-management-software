import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/database/queries';
import { vendorAuthMiddleware } from '@/lib/auth/vendor-auth';
import { ObjectId } from 'mongodb';

export async function GET(
  request: NextRequest,
  context: any
) {
  try {
    // Authenticate vendor
    const authResponse = await vendorAuthMiddleware(request);
    if (!authResponse.isAuthenticated) {
      return NextResponse.json({ error: authResponse.error }, { status: 401 });
    }

    const db = await getDb();
    
  const { params } = context;

  const notifications = await db
      .collection('notifications')
      .find({ 
        $or: [
      { vendorId: params.vendorId },
      { "targetUsers.id": params.vendorId }
        ]
      })
      .sort({ createdAt: -1 })
      .toArray();
    
    const serializedNotifications = notifications.map(notification => ({
      ...notification,
      id: notification._id.toString(),
      _id: undefined
    }));

    return NextResponse.json({
      success: true,
      notifications: serializedNotifications
    });

  } catch (error) {
    console.error('Error fetching vendor notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: any
) {
  try {
    // Authenticate vendor
    const authResponse = await vendorAuthMiddleware(request);
    if (!authResponse.isAuthenticated) {
      return NextResponse.json({ error: authResponse.error }, { status: 401 });
    }

  const body = await request.json();
  const { params } = context;
    const { type, title, message, priority = 'medium' } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, message' },
        { status: 400 }
      );
    }

    const db = await getDb();
    
    const notificationData = {
      type,
      title,
      message,
      priority,
      read: false,
  vendorId: params.vendorId,
      companyId: body.companyId,
      relatedId: body.relatedId,
      relatedModel: body.relatedModel,
      actionUrl: body.actionUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const result = await db.collection('notifications').insertOne(notificationData);
    
    const newNotification = await db.collection('notifications').findOne({ _id: result.insertedId });
    
    if (!newNotification) {
      throw new Error('Failed to create notification');
    }

    const { _id, ...notificationResponse } = newNotification;
    
    return NextResponse.json({
      success: true,
      notification: {
        ...notificationResponse,
        id: _id.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating notification:', error);
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    );
  }
}
