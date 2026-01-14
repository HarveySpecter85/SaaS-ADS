import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';

// Helper to strip sensitive token fields from response
function sanitizeConfig(config: Record<string, unknown>) {
  const { access_token, refresh_token, ...safe } = config;
  return {
    ...safe,
    has_access_token: !!access_token,
    has_refresh_token: !!refresh_token,
  };
}

// GET: Get single CAPI config (tokens hidden for security)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('capi_configs')
    .select('*, brand:brands(id, name)')
    .eq('id', id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 404 });
  }

  // Strip sensitive tokens from response
  return NextResponse.json(sanitizeConfig(data));
}

// PATCH: Update CAPI config
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = await createClient();
  const body = await request.json();

  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  // Allowed update fields
  const allowedFields = [
    'customer_id',
    'conversion_action_id',
    'access_token',
    'refresh_token',
    'is_active',
    'batch_size',
    'sync_interval_minutes',
  ];

  for (const field of allowedFields) {
    if (field in body) {
      // Remove dashes from customer_id
      if (field === 'customer_id') {
        updates[field] = String(body[field]).replace(/-/g, '');
      } else {
        updates[field] = body[field];
      }
    }
  }

  const { data, error } = await supabase
    .from('capi_configs')
    .update(updates)
    .eq('id', id)
    .select('*, brand:brands(id, name)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Strip sensitive tokens from response
  return NextResponse.json(sanitizeConfig(data));
}

// DELETE: Delete CAPI config
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const { id } = await params;
  const supabase = await createClient();

  const { error } = await supabase
    .from('capi_configs')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return new NextResponse(null, { status: 204 });
}
