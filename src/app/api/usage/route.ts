import { NextRequest, NextResponse } from 'next/server';
import { getUsageStats } from '@/lib/api-usage';

// GET: Get usage statistics
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '30');

  try {
    const stats = await getUsageStats(days);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('Failed to get usage stats:', error);
    return NextResponse.json(
      { error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}
