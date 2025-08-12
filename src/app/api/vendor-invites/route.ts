import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Corrected import path
import { encrypt } from '@/lib/auth/encryption';
import { sendVendorInvitationEmail } from '@/lib/email';
import { getDb } from '@/lib/database/queries';

// Generate or send a secure vendor invite
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, email, message, vendorName, inviteUrl } = body;

    if (action === 'generate') {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const inviteData = {
        email: email || '',
        companyId: session.companyId,
        expiresAt: expiresAt.toISOString(),
      };

      const token = encrypt(JSON.stringify(inviteData));
      
      // Get the base URL properly
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     request.headers.get('origin') ||
                     `http://localhost:${process.env.PORT || 9002}`;
      
      const inviteUrl = `${baseUrl}/vendor-portal?token=${token}`;

      const db = await getDb();
      const result = await db.collection('vendorInvites').updateOne(
        { email: email || vendorName, companyId: session.companyId },
        {
          $set: {
            vendorName: vendorName || 'N/A',
            message: message || '',
            status: 'pending',
            used: false,
            createdAt: new Date(),
            expiresAt,
            inviteUrl,
          },
          $setOnInsert: {
            email: email || '',
            companyId: session.companyId,
          }
        },
        { upsert: true }
      );

      return NextResponse.json({ 
        success: true, 
        inviteUrl,
        token,
        expiresAt: expiresAt.toISOString(),
        inviteId: result.upsertedId?.toString() || 'existing'
      });
    }

    if (action === 'send-email') {
      if (!email || !vendorName || !inviteUrl) {
        return NextResponse.json({ error: 'Missing required fields for sending email.' }, { status: 400 });
      }

      const db = await getDb();
      const company = await db.collection('companies').findOne({ companyId: session.companyId });

      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }

      const emailResult = await sendVendorInvitationEmail(email, company.name, inviteUrl, message);
      
      if (!emailResult.success) {
        return NextResponse.json({ error: 'Failed to send invitation email' }, { status: 500 });
      }

      // Update the invite record to track that email was sent
      await db.collection('vendorInvites').updateOne(
        { 
          $or: [
            { email: email, companyId: session.companyId },
            { vendorName: vendorName, companyId: session.companyId }
          ]
        },
        {
          $set: {
            emailSent: email,
            emailSentAt: new Date(),
            status: 'sent'
          }
        }
      );

      return NextResponse.json({ success: true, message: 'Invitation email sent successfully.' });
    }

    return NextResponse.json({ error: 'Invalid action specified.' }, { status: 400 });

  } catch (error) {
    console.error('Vendor invite API error:', error);
    return NextResponse.json({ error: 'Failed to process vendor invite' }, { status: 500 });
  }
}

// Get invite history
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const invites = await db.collection('vendorInvites')
      .find({ companyId: session.companyId })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const now = new Date();
    const processedInvites = invites.map(invite => {
      const isExpired = invite.expiresAt && now > new Date(invite.expiresAt);
      const status = invite.used ? 'completed' : 
                    isExpired ? 'expired' : 
                    invite.status || 'pending';
      
      return {
        inviteId: invite._id?.toString(),
        vendorName: invite.vendorName,
        status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        inviteUrl: invite.inviteUrl,
        email: invite.email,
        message: invite.message,
        emailSent: invite.emailSent || null,
        emailSentAt: invite.emailSentAt || null,
        completedAt: invite.completedAt || null,
      };
    });

    return NextResponse.json({ success: true, invites: processedInvites });

  } catch (error) {
    console.error('Error fetching invite history:', error);
    return NextResponse.json({ error: 'Failed to fetch invite history' }, { status: 500 });
  }
}
