import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { prepareConversionEvent, generateEventId } from '@/lib/conversions';
import { ConversionEventInsert } from '@/lib/supabase/database.types';

// GET: List conversion events (with filters)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const status = searchParams.get('status');
  const event_name = searchParams.get('event_name');
  const campaign_id = searchParams.get('campaign_id');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  let query = supabase
    .from('conversion_events')
    .select('*', { count: 'exact' })
    .order('event_time', { ascending: false })
    .range(offset, offset + limit - 1);

  if (status) query = query.eq('sync_status', status);
  if (event_name) query = query.eq('event_name', event_name);
  if (campaign_id) query = query.eq('campaign_id', campaign_id);

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data, count, limit, offset });
}

// POST: Create new conversion event
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const supabase = await createClient();
  const body = await request.json() as ConversionEventInsert;

  if (!body.event_name) {
    return NextResponse.json({ error: 'event_name is required' }, { status: 400 });
  }

  // Generate event ID if not provided
  const event_id = body.event_id || generateEventId(body.event_name);

  // Prepare event with hashed user data
  const eventData = prepareConversionEvent({
    ...body,
    event_id,
  });

  const { data, error } = await supabase
    .from('conversion_events')
    .insert(eventData)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
