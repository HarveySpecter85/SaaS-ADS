import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { getUsageStats } from '@/lib/api-usage';

export interface DashboardMetrics {
  brands: {
    total: number;
    recent: { id: string; name: string; created_at: string }[];
  };
  campaigns: {
    total: number;
    by_status: { status: string; count: number }[];
    recent: { id: string; name: string; status: string; created_at: string }[];
  };
  assets: {
    total: number;
    by_status: { status: string; count: number }[];
  };
  prompts: {
    total: number;
  };
  conversions: {
    total: number;
    pending: number;
    sent: number;
    failed: number;
  };
  api_usage: {
    total_requests: number;
    total_tokens: number;
    total_cost_usd: number;
  };
}

export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  const supabase = await createClient();

  // Fetch all metrics in parallel
  const [
    brandsResult,
    campaignsResult,
    assetsResult,
    promptsResult,
    conversionsResult,
    usageStats,
  ] = await Promise.all([
    // Brands
    supabase
      .from('brands')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(5),

    // Campaigns
    supabase
      .from('campaigns')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5),

    // Assets
    supabase.from('assets').select('id, status'),

    // Prompts
    supabase.from('prompts').select('id', { count: 'exact', head: true }),

    // Conversions
    supabase.from('conversion_events').select('id, sync_status'),

    // API Usage
    getUsageStats(30),
  ]);

  // Process brands
  const brands = {
    total: brandsResult.data?.length || 0,
    recent: (brandsResult.data || []).slice(0, 5),
  };

  // Count total brands
  const { count: totalBrands } = await supabase
    .from('brands')
    .select('*', { count: 'exact', head: true });
  brands.total = totalBrands || 0;

  // Process campaigns
  const campaignData = campaignsResult.data || [];
  const statusCounts = campaignData.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const { count: totalCampaigns } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true });

  const campaigns = {
    total: totalCampaigns || 0,
    by_status: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
    recent: campaignData.slice(0, 5),
  };

  // Process assets
  const assetData = assetsResult.data || [];
  const assetStatusCounts = assetData.reduce((acc, a) => {
    acc[a.status] = (acc[a.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const assets = {
    total: assetData.length,
    by_status: Object.entries(assetStatusCounts).map(([status, count]) => ({ status, count })),
  };

  // Process prompts
  const prompts = {
    total: promptsResult.count || 0,
  };

  // Process conversions
  const conversionData = conversionsResult.data || [];
  const conversions = {
    total: conversionData.length,
    pending: conversionData.filter(c => c.sync_status === 'pending').length,
    sent: conversionData.filter(c => c.sync_status === 'sent').length,
    failed: conversionData.filter(c => c.sync_status === 'failed').length,
  };

  const metrics: DashboardMetrics = {
    brands,
    campaigns,
    assets,
    prompts,
    conversions,
    api_usage: {
      total_requests: usageStats.total_requests,
      total_tokens: usageStats.total_tokens,
      total_cost_usd: usageStats.total_cost_usd,
    },
  };

  return NextResponse.json(metrics);
}
