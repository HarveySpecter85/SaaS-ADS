import { createClient } from '@/lib/supabase/server';
import { APIUsageInsert, APIProvider } from '@/lib/supabase/database.types';

// Gemini pricing (per 1M tokens) - as of Jan 2026
const PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.0-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-flash': { input: 0.075, output: 0.30 },
  'gemini-1.5-pro': { input: 1.25, output: 5.00 },
  'default': { input: 0.10, output: 0.40 },
};

// Calculate estimated cost
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = PRICING[model] || PRICING['default'];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  return inputCost + outputCost;
}

// Track API usage
export async function trackAPIUsage(usage: APIUsageInsert): Promise<void> {
  try {
    const supabase = await createClient();

    // Calculate cost if tokens provided
    let estimatedCost = usage.estimated_cost_usd || 0;
    if (usage.model && usage.input_tokens && usage.output_tokens) {
      estimatedCost = calculateCost(usage.model, usage.input_tokens, usage.output_tokens);
    }

    await supabase.from('api_usage').insert({
      ...usage,
      estimated_cost_usd: estimatedCost,
    });
  } catch (error) {
    // Log but don't throw - tracking shouldn't break main flow
    console.error('Failed to track API usage:', error);
  }
}

// Helper for timing requests
export function createTimer(): () => number {
  const start = performance.now();
  return () => Math.round(performance.now() - start);
}

// Get usage stats for dashboard
export async function getUsageStats(
  days: number = 30
): Promise<{
  total_requests: number;
  total_tokens: number;
  total_cost_usd: number;
  by_provider: { provider: string; requests: number; tokens: number; cost: number }[];
  by_endpoint: { endpoint: string; requests: number; tokens: number }[];
  by_day: { date: string; requests: number; tokens: number }[];
}> {
  const supabase = await createClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Get all usage in date range
  const { data: usage, error } = await supabase
    .from('api_usage')
    .select('*')
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false });

  if (error || !usage) {
    return {
      total_requests: 0,
      total_tokens: 0,
      total_cost_usd: 0,
      by_provider: [],
      by_endpoint: [],
      by_day: [],
    };
  }

  // Aggregate stats
  const total_requests = usage.length;
  const total_tokens = usage.reduce((sum, u) => sum + (u.total_tokens || 0), 0);
  const total_cost_usd = usage.reduce((sum, u) => sum + Number(u.estimated_cost_usd || 0), 0);

  // Group by provider
  const providerMap = new Map<string, { requests: number; tokens: number; cost: number }>();
  usage.forEach(u => {
    const key = u.api_provider;
    const existing = providerMap.get(key) || { requests: 0, tokens: 0, cost: 0 };
    providerMap.set(key, {
      requests: existing.requests + 1,
      tokens: existing.tokens + (u.total_tokens || 0),
      cost: existing.cost + Number(u.estimated_cost_usd || 0),
    });
  });
  const by_provider = Array.from(providerMap.entries()).map(([provider, stats]) => ({
    provider,
    ...stats,
  }));

  // Group by endpoint
  const endpointMap = new Map<string, { requests: number; tokens: number }>();
  usage.forEach(u => {
    const key = u.api_endpoint;
    const existing = endpointMap.get(key) || { requests: 0, tokens: 0 };
    endpointMap.set(key, {
      requests: existing.requests + 1,
      tokens: existing.tokens + (u.total_tokens || 0),
    });
  });
  const by_endpoint = Array.from(endpointMap.entries()).map(([endpoint, stats]) => ({
    endpoint,
    ...stats,
  }));

  // Group by day
  const dayMap = new Map<string, { requests: number; tokens: number }>();
  usage.forEach(u => {
    const date = u.created_at.split('T')[0];
    const existing = dayMap.get(date) || { requests: 0, tokens: 0 };
    dayMap.set(date, {
      requests: existing.requests + 1,
      tokens: existing.tokens + (u.total_tokens || 0),
    });
  });
  const by_day = Array.from(dayMap.entries())
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    total_requests,
    total_tokens,
    total_cost_usd,
    by_provider,
    by_endpoint,
    by_day,
  };
}
