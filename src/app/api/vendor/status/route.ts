import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/data';
import { decrypt } from '@/lib/encryption';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  try {
    const db = await getDb();
    
    // Decrypt the token to get the vendor's email
    const decryptedPayload = decrypt(token);
    const { email, expiresAt } = JSON.parse(decryptedPayload);

    if (new Date() > new Date(expiresAt)) {
      return NextResponse.json({ status: 'expired' }, { status: 400 });
    }

    // Find the application using the email from the token
    const application = await db.collection('vendorApplications').findOne({ email });

    // If an application exists, return its status
    if (application) {
      return NextResponse.json({
        status: application.status, // e.g., 'approved', 'rejected'
        vendorName: application.vendorName,
        companyName: application.companyName,
      });
    }

    // If no application is found, the invite is valid but the vendor hasn't registered yet.
    // The frontend should display the registration form.
    return NextResponse.json({ status: 'pending_registration' });

  } catch (error) {
    console.error('Error fetching vendor status:', error);

    // Handle specific errors for better client-side feedback
    if (error instanceof Error && (error.message.includes('Invalid token') || error.message.includes('bad decrypt'))) {
        return NextResponse.json({ error: 'Invalid or malformed token' }, { status: 400 });
    }
    if (error instanceof SyntaxError) { // JSON.parse error
        return NextResponse.json({ error: 'Token payload is corrupted' }, { status: 400 });
    }

    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
