import { NextResponse } from 'next/server';
import { migrateDataForMultiTenancy, verifyMigration } from '@/lib/database/migrations';

export async function POST() {
  try {
    // Run the migration
    await migrateDataForMultiTenancy();
    
    // Verify it worked
    const verification = await verifyMigration();
    
    return NextResponse.json({
      success: true,
      message: 'Multi-tenant migration completed',
      verification
    });
  } catch (error) {
    console.error('Migration API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const verification = await verifyMigration();
    return NextResponse.json({
      message: 'Migration verification',
      ...verification
    });
  } catch (error) {
    console.error('Verification API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Verification failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
