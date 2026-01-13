import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { CampaignWithPrompts, CampaignGoal, CampaignStatus } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Valid campaign goals and statuses
const VALID_GOALS: CampaignGoal[] = ['awareness', 'lead_gen', 'conversion'];
const VALID_STATUSES: CampaignStatus[] = ['draft', 'generating', 'complete'];

// GET: Get a single campaign with all prompts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Fetch prompts sorted by created_at
    const { data: prompts } = await supabase
      .from("prompts")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true });

    const campaignWithPrompts: CampaignWithPrompts = {
      ...campaign,
      prompts: prompts || [],
    };

    return NextResponse.json(campaignWithPrompts);
  } catch (error) {
    console.error("GET /api/campaigns/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update campaign metadata (name, goal, status)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Check if campaign exists
    const { data: existingCampaign, error: checkError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Update campaign fields if provided
    const { name, goal, status } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;

    if (goal !== undefined) {
      if (!VALID_GOALS.includes(goal)) {
        return NextResponse.json(
          { error: "Invalid goal. Must be one of: awareness, lead_gen, conversion" },
          { status: 400 }
        );
      }
      updateData.goal = goal;
    }

    if (status !== undefined) {
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: "Invalid status. Must be one of: draft, generating, complete" },
          { status: 400 }
        );
      }
      updateData.status = status;
    }

    const { error: updateError } = await supabase
      .from("campaigns")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update campaign", details: updateError.message },
        { status: 500 }
      );
    }

    // Fetch and return updated campaign with prompts
    const { data: updatedCampaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    const { data: prompts } = await supabase
      .from("prompts")
      .select("*")
      .eq("campaign_id", id)
      .order("created_at", { ascending: true });

    const campaignWithPrompts: CampaignWithPrompts = {
      ...updatedCampaign,
      prompts: prompts || [],
    };

    return NextResponse.json(campaignWithPrompts);
  } catch (error) {
    console.error("PATCH /api/campaigns/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete campaign (cascades to prompts)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if campaign exists
    const { data: existingCampaign, error: checkError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingCampaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Delete campaign (cascade will handle prompts)
    const { error: deleteError } = await supabase
      .from("campaigns")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete campaign", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
