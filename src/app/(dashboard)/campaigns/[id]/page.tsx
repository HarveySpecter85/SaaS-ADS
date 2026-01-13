import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { CampaignWithPrompts, Product } from "@/lib/supabase/database.types";
import { CampaignProfileClient } from "./client";

interface CampaignPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignPage({ params }: CampaignPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch campaign
  const { data: campaign, error: campaignError } = await supabase
    .from("campaigns")
    .select("*")
    .eq("id", id)
    .single();

  if (campaignError || !campaign) {
    notFound();
  }

  // Fetch prompts
  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  // Fetch product name
  const { data: product } = await supabase
    .from("products")
    .select("id, name")
    .eq("id", campaign.product_id)
    .single();

  const campaignWithPrompts: CampaignWithPrompts = {
    ...campaign,
    prompts: prompts || [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to Campaigns
        </Link>
      </div>

      {/* Client-side interactive sections */}
      <CampaignProfileClient
        campaign={campaignWithPrompts}
        productName={product?.name}
        productId={product?.id}
      />
    </div>
  );
}
