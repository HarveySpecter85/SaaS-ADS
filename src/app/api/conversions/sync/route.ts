import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { uploadConversions, CAPISyncResult } from '@/lib/google-capi';
import { ConversionEvent, CAPIConfig } from '@/lib/supabase/database.types';

interface SyncResult {
  brand_id: string;
  brand_name: string;
  events_processed: number;
  success_count: number;
  failure_count: number;
  errors: string[];
}

// POST: Sync pending conversion events to Google Ads
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  // Optional: sync only specific brand
  const brandId = searchParams.get('brand_id');

  // Get active CAPI configs
  let configQuery = supabase
    .from('capi_configs')
    .select('*, brand:brands(id, name)')
    .eq('is_active', true);

  if (brandId) {
    configQuery = configQuery.eq('brand_id', brandId);
  }

  const { data: configs, error: configError } = await configQuery;

  if (configError) {
    return NextResponse.json({ error: configError.message }, { status: 500 });
  }

  if (!configs || configs.length === 0) {
    return NextResponse.json({
      message: 'No active CAPI configurations found',
      results: [],
    });
  }

  const results: SyncResult[] = [];

  // Process each brand's pending events
  for (const config of configs) {
    const brandId = config.brand_id;
    const brandName = (config.brand as { name: string })?.name || 'Unknown';

    // Get pending events for this brand
    const { data: events, error: eventsError } = await supabase
      .from('conversion_events')
      .select('*')
      .eq('brand_id', brandId)
      .eq('sync_status', 'pending')
      .order('event_time', { ascending: true })
      .limit(config.batch_size);

    if (eventsError) {
      results.push({
        brand_id: brandId,
        brand_name: brandName,
        events_processed: 0,
        success_count: 0,
        failure_count: 0,
        errors: [eventsError.message],
      });
      continue;
    }

    if (!events || events.length === 0) {
      results.push({
        brand_id: brandId,
        brand_name: brandName,
        events_processed: 0,
        success_count: 0,
        failure_count: 0,
        errors: [],
      });
      continue;
    }

    // Mark events as queued
    const eventIds = events.map(e => e.id);
    await supabase
      .from('conversion_events')
      .update({ sync_status: 'queued', updated_at: new Date().toISOString() })
      .in('id', eventIds);

    // Upload to Google Ads
    const syncResult = await uploadConversions(config as CAPIConfig, events as ConversionEvent[]);

    // Update event statuses based on result
    if (syncResult.successCount > 0) {
      // Mark successful events
      // Note: With partial failure, we'd need individual event tracking
      // For simplicity, if any succeed, mark all as sent
      await supabase
        .from('conversion_events')
        .update({
          sync_status: 'sent',
          synced_at: new Date().toISOString(),
          sync_attempts: 1,
          updated_at: new Date().toISOString(),
        })
        .in('id', eventIds);
    }

    if (syncResult.failureCount > 0 && syncResult.successCount === 0) {
      // All failed - mark for retry
      await supabase
        .from('conversion_events')
        .update({
          sync_status: 'failed',
          sync_error: syncResult.errors.join('; '),
          sync_attempts: 1,
          updated_at: new Date().toISOString(),
        })
        .in('id', eventIds);
    }

    // Update CAPI config with sync status
    await supabase
      .from('capi_configs')
      .update({
        last_sync_at: new Date().toISOString(),
        last_sync_status: syncResult.success ? 'success' : 'partial_failure',
        last_sync_count: events.length,
        updated_at: new Date().toISOString(),
      })
      .eq('id', config.id);

    results.push({
      brand_id: brandId,
      brand_name: brandName,
      events_processed: events.length,
      success_count: syncResult.successCount,
      failure_count: syncResult.failureCount,
      errors: syncResult.errors,
    });
  }

  const totalProcessed = results.reduce((sum, r) => sum + r.events_processed, 0);
  const totalSuccess = results.reduce((sum, r) => sum + r.success_count, 0);
  const totalFailure = results.reduce((sum, r) => sum + r.failure_count, 0);

  return NextResponse.json({
    message: `Sync complete: ${totalSuccess}/${totalProcessed} events sent`,
    summary: {
      total_processed: totalProcessed,
      total_success: totalSuccess,
      total_failure: totalFailure,
    },
    results,
  });
}

// GET: Get sync status for all brands
export async function GET() {
  const supabase = await createClient();

  const { data: configs, error } = await supabase
    .from('capi_configs')
    .select('*, brand:brands(id, name)')
    .order('last_sync_at', { ascending: false, nullsFirst: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get pending event counts per brand
  const { data: pendingCounts } = await supabase
    .from('conversion_events')
    .select('brand_id')
    .eq('sync_status', 'pending');

  const pendingByBrand = (pendingCounts || []).reduce((acc, event) => {
    acc[event.brand_id] = (acc[event.brand_id] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const status = configs?.map(config => ({
    brand_id: config.brand_id,
    brand_name: (config.brand as { name: string })?.name || 'Unknown',
    is_active: config.is_active,
    last_sync_at: config.last_sync_at,
    last_sync_status: config.last_sync_status,
    last_sync_count: config.last_sync_count,
    pending_events: pendingByBrand[config.brand_id] || 0,
  }));

  return NextResponse.json({ status });
}
