import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { Asset, Prompt } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Default asset dimensions (Meta/Google landscape)
const DEFAULT_WIDTH = 1200;
const DEFAULT_HEIGHT = 628;
const DEFAULT_FORMAT = 'png';

// POST: Generate assets for campaign prompts (stub for now)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id: campaignId } = await params;

    if (!isValidUUID(campaignId)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Parse request body
    let promptIds: string[] | undefined;
    try {
      const body = await request.json();
      promptIds = body.prompt_ids;
    } catch {
      // Empty body is OK - will generate for all prompts
    }

    // Validate prompt_ids if provided
    if (promptIds !== undefined) {
      if (!Array.isArray(promptIds)) {
        return NextResponse.json(
          { error: "prompt_ids must be an array" },
          { status: 400 }
        );
      }
      for (const pid of promptIds) {
        if (!isValidUUID(pid)) {
          return NextResponse.json(
            { error: `Invalid prompt_id format: ${pid}` },
            { status: 400 }
          );
        }
      }
    }

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 400 }
      );
    }

    // Fetch prompts for this campaign
    let promptsQuery = supabase
      .from("prompts")
      .select("*")
      .eq("campaign_id", campaignId);

    // Filter by specific prompt_ids if provided
    if (promptIds && promptIds.length > 0) {
      promptsQuery = promptsQuery.in("id", promptIds);
    }

    const { data: prompts, error: promptsError } = await promptsQuery;

    if (promptsError) {
      return NextResponse.json(
        { error: "Failed to fetch prompts", details: promptsError.message },
        { status: 500 }
      );
    }

    if (!prompts || prompts.length === 0) {
      return NextResponse.json(
        { error: "No prompts found for this campaign" },
        { status: 400 }
      );
    }

    // Generate assets for each prompt
    const createdAssets: Asset[] = [];

    for (const prompt of prompts as Prompt[]) {
      // Create placeholder asset with 'generating' status
      const { data: asset, error: insertError } = await supabase
        .from("assets")
        .insert({
          prompt_id: prompt.id,
          campaign_id: campaignId,
          image_url: '', // Will be updated below
          width: DEFAULT_WIDTH,
          height: DEFAULT_HEIGHT,
          format: DEFAULT_FORMAT,
          platform: null, // Original asset, no platform yet
          status: 'generating',
        })
        .select()
        .single();

      if (insertError || !asset) {
        console.error("Failed to create asset:", insertError);
        continue;
      }

      // STUB: In production, this would call Imagen 3 API
      // For now, use a placeholder image URL with the prompt text
      const placeholderText = encodeURIComponent(
        prompt.headline || prompt.variation_type || 'Asset Placeholder'
      );
      const placeholderUrl = `https://placehold.co/${DEFAULT_WIDTH}x${DEFAULT_HEIGHT}/333/white?text=${placeholderText}`;

      // Update asset with placeholder URL and complete status
      const { data: updatedAsset, error: updateError } = await supabase
        .from("assets")
        .update({
          image_url: placeholderUrl,
          status: 'complete',
        })
        .eq("id", asset.id)
        .select()
        .single();

      if (updateError) {
        console.error("Failed to update asset:", updateError);
        // Mark as failed
        await supabase
          .from("assets")
          .update({ status: 'failed' })
          .eq("id", asset.id);
        continue;
      }

      createdAssets.push(updatedAsset as Asset);
    }

    return NextResponse.json({
      success: true,
      campaign_id: campaignId,
      assets_created: createdAssets.length,
      assets: createdAssets,
    });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/generate-assets error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
