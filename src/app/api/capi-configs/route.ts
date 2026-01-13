import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET: List all CAPI configs
export async function GET() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('capi_configs')
    .select('*, brand:brands(id, name)')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

// POST: Create new CAPI config for a brand
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const body = await request.json();

  const { brand_id, customer_id, conversion_action_id, access_token, refresh_token } = body;

  if (!brand_id || !customer_id || !conversion_action_id) {
    return NextResponse.json(
      { error: 'brand_id, customer_id, and conversion_action_id are required' },
      { status: 400 }
    );
  }

  // Check if config already exists for brand
  const { data: existing } = await supabase
    .from('capi_configs')
    .select('id')
    .eq('brand_id', brand_id)
    .single();

  if (existing) {
    return NextResponse.json(
      { error: 'CAPI config already exists for this brand. Use PATCH to update.' },
      { status: 409 }
    );
  }

  const { data, error } = await supabase
    .from('capi_configs')
    .insert({
      brand_id,
      customer_id: customer_id.replace(/-/g, ''), // Remove dashes
      conversion_action_id,
      access_token: access_token || null,
      refresh_token: refresh_token || null,
    })
    .select('*, brand:brands(id, name)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data, { status: 201 });
}
