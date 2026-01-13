import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CampaignCard } from "@/components/campaign-card";
import type { Campaign, Product } from "@/lib/supabase/database.types";

export default async function CampaignsPage() {
  const supabase = await createClient();

  // Fetch all campaigns
  const { data: campaigns, error: campaignsError } = await supabase
    .from("campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  if (campaignsError) {
    console.error("Error fetching campaigns:", campaignsError);
    return (
      <div className="text-red-600">
        Error loading campaigns. Please try again.
      </div>
    );
  }

  // Early return if no campaigns
  if (!campaigns || campaigns.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
          <Link
            href="/campaigns/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            New Campaign
          </Link>
        </div>

        {/* Empty State */}
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No campaigns yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Create a campaign to start generating ad creatives.
          </p>
          <Link
            href="/campaigns/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Create Your First Campaign
          </Link>
        </div>
      </div>
    );
  }

  // Get prompt counts for all campaigns
  const campaignIds = campaigns.map((c: Campaign) => c.id);

  const { data: prompts } = await supabase
    .from("prompts")
    .select("campaign_id")
    .in("campaign_id", campaignIds);

  // Count prompts per campaign
  const promptCountMap = new Map<string, number>();
  prompts?.forEach((p: { campaign_id: string }) => {
    const current = promptCountMap.get(p.campaign_id) || 0;
    promptCountMap.set(p.campaign_id, current + 1);
  });

  // Fetch product names for campaigns
  const productIds = [...new Set(campaigns.map((c: Campaign) => c.product_id))];
  const { data: products } = await supabase
    .from("products")
    .select("id, name")
    .in("id", productIds);

  // Create product lookup map
  const productMap = new Map<string, string>();
  products?.forEach((product: Pick<Product, "id" | "name">) => {
    productMap.set(product.id, product.name);
  });

  // Add prompt_count to each campaign
  const campaignsWithCount = campaigns.map((campaign: Campaign) => ({
    ...campaign,
    prompt_count: promptCountMap.get(campaign.id) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Campaigns</h1>
        <Link
          href="/campaigns/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          New Campaign
        </Link>
      </div>

      {/* Campaign Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {campaignsWithCount.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            productName={productMap.get(campaign.product_id)}
          />
        ))}
      </div>
    </div>
  );
}
