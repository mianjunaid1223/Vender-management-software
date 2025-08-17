import { NextRequest, NextResponse } from 'next/server';

// Minimal email service route to satisfy type generation and provide a safe default
export async function POST(request: NextRequest) {
	try {
		const body = await request.json().catch(() => ({}));
		// In this minimal implementation we just acknowledge receipt.
		return NextResponse.json({ ok: true, received: body });
	} catch (error) {
		console.error('Email service route error:', error);
		return NextResponse.json({ error: 'Email service failed' }, { status: 500 });
	}
}

export async function GET() {
	return NextResponse.json({ ok: true, message: 'Email service endpoint' });
}
