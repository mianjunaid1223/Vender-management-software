import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import mongoose from 'mongoose';

// Define Notification schema
const notificationSchema = new mongoose.Schema({
  vendorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
  companyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  type: { 
    type: String, 
    enum: ['invoice', 'contract', 'payment', 'general', 'reminder', 'alert'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  read: { type: Boolean, default: false },
  readAt: Date,
  relatedId: mongoose.Schema.Types.ObjectId, // Reference to invoice, contract, etc.
  relatedModel: String, // Model name (Invoice, Contract, etc.)
  actionUrl: String, // URL for related action
  expiresAt: Date, // Optional expiration date
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    await connectDB();
    const { vendorId } = await params;

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Convert vendorId to ObjectId
    let vendorObjectId;
    try {
      vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid vendor ID format' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const type = searchParams.get('type');
    const unreadOnly = searchParams.get('unreadOnly') === 'true';
    const priority = searchParams.get('priority');

    // Build query
    const query: any = { 
      vendorId: vendorObjectId,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    if (type && type !== 'all') {
      query.type = type;
    }

    if (unreadOnly) {
      query.read = false;
    }

    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    // Get total count for pagination
    const totalNotifications = await Notification.countDocuments(query);

    // Get notifications with pagination
    const notifications = await Notification.find(query)
      .populate('companyId', 'name email')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Calculate pagination info
    const totalPages = Math.ceil(totalNotifications / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    // Get unread count
    const unreadCount = await Notification.countDocuments({
      vendorId: vendorObjectId,
      read: false,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    // Get type breakdown
    const typeStats = await Notification.aggregate([
      { 
        $match: { 
          vendorId: vendorObjectId,
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: { $gt: new Date() } }
          ]
        } 
      },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $eq: ['$read', false] }, 1, 0] }
          }
        }
      }
    ]);

    return NextResponse.json({
      notifications: notifications.map(notification => ({
        id: notification._id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        priority: notification.priority,
        read: notification.read,
        readAt: notification.readAt,
        relatedId: notification.relatedId,
        relatedModel: notification.relatedModel,
        actionUrl: notification.actionUrl,
        company: notification.companyId,
        createdAt: notification.createdAt,
        expiresAt: notification.expiresAt
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalNotifications,
        hasNextPage,
        hasPrevPage,
        limit
      },
      summary: {
        unreadCount,
        typeBreakdown: typeStats.reduce((acc, stat) => {
          acc[stat._id] = {
            total: stat.count,
            unread: stat.unreadCount
          };
          return acc;
        }, {} as Record<string, { total: number; unread: number }>)
      }
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
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    await connectDB();
    const { vendorId } = await params;
    const body = await request.json();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Convert vendorId to ObjectId
    let vendorObjectId;
    try {
      vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid vendor ID format' }, { status: 400 });
    }

    const notificationData = {
      ...body,
      vendorId: vendorObjectId,
      companyId: new mongoose.Types.ObjectId(body.companyId),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const notification = new Notification(notificationData);
    await notification.save();

    const populatedNotification = await Notification.findById(notification._id)
      .populate('companyId', 'name email')
      .lean();

    return NextResponse.json({
      success: true,
      notification: {
        id: populatedNotification!._id,
        type: populatedNotification!.type,
        title: populatedNotification!.title,
        message: populatedNotification!.message,
        priority: populatedNotification!.priority,
        read: populatedNotification!.read,
        relatedId: populatedNotification!.relatedId,
        relatedModel: populatedNotification!.relatedModel,
        actionUrl: populatedNotification!.actionUrl,
        company: populatedNotification!.companyId,
        createdAt: populatedNotification!.createdAt
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    await connectDB();
    const { vendorId } = await params;
    const body = await request.json();

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 });
    }

    // Convert vendorId to ObjectId
    let vendorObjectId;
    try {
      vendorObjectId = new mongoose.Types.ObjectId(vendorId);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid vendor ID format' }, { status: 400 });
    }

    const { notificationIds, markAsRead } = body;

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json({ error: 'Notification IDs array is required' }, { status: 400 });
    }

    const updateData: any = {
      read: markAsRead !== undefined ? markAsRead : true,
      updatedAt: new Date()
    };

    if (markAsRead) {
      updateData.readAt = new Date();
    }

    const result = await Notification.updateMany(
      {
        _id: { $in: notificationIds.map(id => new mongoose.Types.ObjectId(id)) },
        vendorId: vendorObjectId
      },
      updateData
    );

    return NextResponse.json({
      success: true,
      updatedCount: result.modifiedCount,
      message: `${result.modifiedCount} notifications updated successfully`
    });

  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
