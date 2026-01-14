import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { Campaign, CampaignGoal } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Valid campaign goals
const VALID_GOALS: CampaignGoal[] = ['awareness', 'lead_gen', 'conversion'];

// GET: List all campaigns (optionally filter by product_id query param)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("product_id");

    // Build query - select campaigns with prompt count
    let query = supabase
      .from("campaigns")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by product_id if provided
    if (productId) {
      if (!isValidUUID(productId)) {
        return NextResponse.json(
          { error: "Invalid product_id format" },
          { status: 400 }
        );
      }
      query = query.eq("product_id", productId);
    }

    const { data: campaigns, error: campaignsError } = await query;

    if (campaignsError) {
      return NextResponse.json(
        { error: "Failed to fetch campaigns", details: campaignsError.message },
        { status: 500 }
      );
    }

    if (!campaigns || campaigns.length === 0) {
      return NextResponse.json([]);
    }

    // Get prompt counts for all campaigns
    const campaignIds = campaigns.map((c: Campaign) => c.id);

    const { data: promptCounts } = await supabase
      .from("prompts")
      .select("campaign_id")
      .in("campaign_id", campaignIds);

    // Count prompts per campaign
    const countMap = new Map<string, number>();
    promptCounts?.forEach((p: { campaign_id: string }) => {
      const current = countMap.get(p.campaign_id) || 0;
      countMap.set(p.campaign_id, current + 1);
    });

    // Add prompt_count to each campaign
    const campaignsWithCount = campaigns.map((campaign: Campaign) => ({
      ...campaign,
      prompt_count: countMap.get(campaign.id) || 0,
    }));

    return NextResponse.json(campaignsWithCount);
  } catch (error) {
    console.error("GET /api/campaigns error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new campaign
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, product_id, goal } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!product_id) {
      return NextResponse.json(
        { error: "product_id is required" },
        { status: 400 }
      );
    }

    if (!isValidUUID(product_id)) {
      return NextResponse.json(
        { error: "Invalid product_id format" },
        { status: 400 }
      );
    }

    if (!goal) {
      return NextResponse.json(
        { error: "Goal is required" },
        { status: 400 }
      );
    }

    if (!VALID_GOALS.includes(goal)) {
      return NextResponse.json(
        { error: "Invalid goal. Must be one of: awareness, lead_gen, conversion" },
        { status: 400 }
      );
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        name,
        product_id,
        goal,
        status: 'draft',
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create campaign", details: error.message },
        { status: 500 }
      );
    }

    // Return campaign with prompt_count = 0
    const campaignWithCount = {
      ...campaign,
      prompt_count: 0,
    };

    return NextResponse.json(campaignWithCount, { status: 201 });
  } catch (error) {
    console.error("POST /api/campaigns error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
