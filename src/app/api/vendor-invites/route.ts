import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth'; // Corrected import path
import { encrypt } from '@/lib/encryption';
import { sendVendorInvitationEmail } from '@/lib/email';
import { getDb } from '@/lib/data';

// Generate or send a secure vendor invite
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, email, message, vendorName, inviteUrl: existingInviteUrl } = body;

    if (action === 'generate') {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      const inviteData = {
        email,
        companyId: session.companyId,
        expiresAt: expiresAt.toISOString(),
      };

      const token = encrypt(JSON.stringify(inviteData));
      const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/vendor-portal?token=${token}`;

      const db = await getDb();
      await db.collection('vendorInvites').updateOne(
        { email: email, companyId: session.companyId },
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
            email: email,
            companyId: session.companyId,
          }
        },
        { upsert: true }
      );

      return NextResponse.json({ success: true, inviteUrl });
    }

    if (action === 'send-email') {
      if (!email || !vendorName || !existingInviteUrl) {
        return NextResponse.json({ error: 'Missing required fields for sending email.' }, { status: 400 });
      }

      const db = await getDb();
      const company = await db.collection('companies').findOne({ companyId: session.companyId });

      if (!company) {
        return NextResponse.json({ error: 'Company not found' }, { status: 404 });
      }

      await sendVendorInvitationEmail(email, company.name, existingInviteUrl, message);

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
                    'pending';
      
      return {
        vendorName: invite.vendorName,
        status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        inviteUrl: invite.inviteUrl,
        email: invite.email,
        message: invite.message,
      };
    });

    return NextResponse.json({ success: true, invites: processedInvites });

  } catch (error) {
    console.error('Error fetching invite history:', error);
    return NextResponse.json({ error: 'Failed to fetch invite history' }, { status: 500 });
  }
}
