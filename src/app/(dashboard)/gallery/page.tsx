import { createClient } from "@/lib/supabase/server";
import { GalleryClient } from "./client";
import type { Campaign, Product, Asset, Prompt } from "@/lib/supabase/database.types";

// Extended types for gallery data
interface CampaignWithAssetCount extends Campaign {
  product_name: string;
  asset_count: number;
}

interface GalleryData {
  campaigns: CampaignWithAssetCount[];
  products: Array<{ id: string; name: string }>;
  assets: Asset[];
  prompts: Prompt[];
}

export default async function GalleryPage() {
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
        Error loading gallery. Please try again.
      </div>
    );
  }

  // Early return if no campaigns
  if (!campaigns || campaigns.length === 0) {
    return <GalleryClient data={{ campaigns: [], products: [], assets: [], prompts: [] }} />;
  }

  // Get all campaign IDs
  const campaignIds = campaigns.map((c: Campaign) => c.id);

  // Fetch all assets for these campaigns
  const { data: assets } = await supabase
    .from("assets")
    .select("*")
    .in("campaign_id", campaignIds)
    .eq("status", "complete")
    .order("created_at", { ascending: false });

  // Count assets per campaign
  const assetCountMap = new Map<string, number>();
  assets?.forEach((a: Asset) => {
    const current = assetCountMap.get(a.campaign_id) || 0;
    assetCountMap.set(a.campaign_id, current + 1);
  });

  // Fetch all prompts for these campaigns (for search functionality)
  const { data: prompts } = await supabase
    .from("prompts")
    .select("*")
    .in("campaign_id", campaignIds);

  // Fetch product names
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

  // Build campaigns with counts and product names
  const campaignsWithData: CampaignWithAssetCount[] = campaigns.map((campaign: Campaign) => ({
    ...campaign,
    product_name: productMap.get(campaign.product_id) || "Unknown Product",
    asset_count: assetCountMap.get(campaign.id) || 0,
  }));

  const galleryData: GalleryData = {
    campaigns: campaignsWithData,
    products: products || [],
    assets: assets || [],
    prompts: prompts || [],
  };

  return <GalleryClient data={galleryData} />;
}
