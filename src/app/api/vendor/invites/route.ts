import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { encrypt } from '@/lib/encryption';
import { sendVendorInvitationEmail } from '@/lib/email';
import { getDb } from '@/lib/data';
import { ObjectId } from 'mongodb';

// Generate vendor invite
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { vendorName, email, message } = body;

    if (!vendorName) {
      return NextResponse.json({ error: 'Vendor name is required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get company info
    const company = await db.collection('companies').findOne({ companyId: session.companyId });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Check if invite already exists for this vendor/company combo
    const existingInvite = await db.collection('vendorInvites').findOne({
      vendorName,
      companyId: session.companyId,
      status: 'active'
    });

    if (existingInvite) {
      return NextResponse.json({
        success: true,
        inviteUrl: existingInvite.inviteUrl,
        token: existingInvite.token,
        expiresAt: existingInvite.expiresAt,
        inviteId: existingInvite._id.toString(),
        message: 'Using existing active invite'
      });
    }

    // Create new invite
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    const inviteData = {
      vendorName,
      companyId: session.companyId,
      companyName: company.name,
      email: email || '',
      expiresAt: expiresAt.toISOString(),
      timestamp: Date.now()
    };

    const token = encrypt(JSON.stringify(inviteData));
    
    // Get base URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   request.headers.get('origin') ||
                   'http://localhost:3000';
    
    const inviteUrl = `${baseUrl}/vendor-register?token=${encodeURIComponent(token)}`;

    // Save invite to database
    const inviteRecord = {
      _id: new ObjectId(),
      vendorName,
      companyId: session.companyId,
      companyName: company.name,
      email: email || '',
      message: message || '',
      token,
      inviteUrl,
      status: 'active',
      used: false,
      createdAt: new Date(),
      expiresAt,
      emailSent: false
    };

    await db.collection('vendorInvites').insertOne(inviteRecord);

    // Send email if email provided
    if (email) {
      try {
        const emailResult = await sendVendorInvitationEmail(
          email, 
          company.name, 
          inviteUrl, 
          message || `You've been invited to join ${company.name}'s vendor network.`
        );
        
        if (emailResult.success) {
          await db.collection('vendorInvites').updateOne(
            { _id: inviteRecord._id },
            { $set: { emailSent: true, emailSentAt: new Date() } }
          );
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError);
        // Continue anyway - invite is still valid
      }
    }

    return NextResponse.json({
      success: true,
      inviteUrl,
      token,
      expiresAt: expiresAt.toISOString(),
      inviteId: inviteRecord._id.toString()
    });

  } catch (error) {
    console.error('Error creating vendor invite:', error);
    return NextResponse.json({ error: 'Failed to create vendor invite' }, { status: 500 });
  }
}

// Send email for existing invite
export async function PUT(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.companyId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { inviteId, email, vendorName, message } = body;

    if (!inviteId || !email) {
      return NextResponse.json({ error: 'Invite ID and email are required' }, { status: 400 });
    }

    const db = await getDb();
    
    // Get company info
    const company = await db.collection('companies').findOne({ companyId: session.companyId });
    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 });
    }

    // Get the invite
    const invite = await db.collection('vendorInvites').findOne({
      _id: new ObjectId(inviteId),
      companyId: session.companyId
    });

    if (!invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Send email
    try {
      console.log('🚀 Sending email invitation:', {
        to: email,
        vendorName: vendorName || invite.vendorName,
        companyName: company.name,
        inviteUrl: invite.inviteUrl
      });

      const emailResult = await sendVendorInvitationEmail(
        email, 
        company.name, 
        invite.inviteUrl, 
        message || `You've been invited to join ${company.name}'s vendor network.`
      );
      
      if (emailResult.success) {
        // Update invite record
        await db.collection('vendorInvites').updateOne(
          { _id: invite._id },
          { 
            $set: { 
              emailSent: true, 
              emailSentAt: new Date(),
              email: email // Update email if it was different
            } 
          }
        );

        return NextResponse.json({
          success: true,
          message: 'Email sent successfully',
          messageId: emailResult.messageId
        });
      } else {
        throw new Error(emailResult.error || 'Failed to send email');
      }
    } catch (emailError) {
      console.error('❌ Email sending failed:', emailError);
      return NextResponse.json({ 
        error: 'Failed to send email: ' + (emailError instanceof Error ? emailError.message : 'Unknown error')
      }, { status: 500 });
    }

  } catch (error) {
    console.error('Error in PUT /api/vendor/invites:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
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
      let status = invite.status;
      
      if (isExpired && status === 'active') {
        status = 'expired';
      }
      
      return {
        inviteId: invite._id.toString(),
        vendorName: invite.vendorName,
        email: invite.email,
        status,
        createdAt: invite.createdAt,
        expiresAt: invite.expiresAt,
        inviteUrl: invite.inviteUrl,
        message: invite.message,
        emailSent: invite.emailSent,
        emailSentAt: invite.emailSentAt,
        used: invite.used
      };
    });

    return NextResponse.json({ success: true, invites: processedInvites });

  } catch (error) {
    console.error('Error fetching invite history:', error);
    return NextResponse.json({ error: 'Failed to fetch invite history' }, { status: 500 });
  }
}
