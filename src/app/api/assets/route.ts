import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { AdPlatform } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Valid ad platforms
const VALID_PLATFORMS: AdPlatform[] = ['google_ads', 'meta', 'tiktok'];

// GET: List all assets (filter by campaign_id, prompt_id, platform query params)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);

    const campaignId = searchParams.get("campaign_id");
    const promptId = searchParams.get("prompt_id");
    const platform = searchParams.get("platform");

    // Build query
    let query = supabase
      .from("assets")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by campaign_id if provided
    if (campaignId) {
      if (!isValidUUID(campaignId)) {
        return NextResponse.json(
          { error: "Invalid campaign_id format" },
          { status: 400 }
        );
      }
      query = query.eq("campaign_id", campaignId);
    }

    // Filter by prompt_id if provided
    if (promptId) {
      if (!isValidUUID(promptId)) {
        return NextResponse.json(
          { error: "Invalid prompt_id format" },
          { status: 400 }
        );
      }
      query = query.eq("prompt_id", promptId);
    }

    // Filter by platform if provided
    if (platform) {
      if (!VALID_PLATFORMS.includes(platform as AdPlatform)) {
        return NextResponse.json(
          { error: "Invalid platform. Must be one of: google_ads, meta, tiktok" },
          { status: 400 }
        );
      }
      query = query.eq("platform", platform);
    }

    const { data: assets, error: assetsError } = await query;

    if (assetsError) {
      return NextResponse.json(
        { error: "Failed to fetch assets", details: assetsError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(assets || []);
  } catch (error) {
    console.error("GET /api/assets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
