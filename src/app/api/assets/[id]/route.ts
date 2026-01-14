import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { AssetWithPrompt, Prompt } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET: Get a single asset with prompt info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid asset ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch asset
    const { data: asset, error: assetError } = await supabase
      .from("assets")
      .select("*")
      .eq("id", id)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Fetch related prompt
    const { data: prompt } = await supabase
      .from("prompts")
      .select("*")
      .eq("id", asset.prompt_id)
      .single();

    const assetWithPrompt: AssetWithPrompt = {
      ...asset,
      prompt: prompt as Prompt,
    };

    return NextResponse.json(assetWithPrompt);
  } catch (error) {
    console.error("GET /api/assets/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete asset (also removes from storage)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid asset ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if asset exists and get image_url for storage deletion
    const { data: existingAsset, error: checkError } = await supabase
      .from("assets")
      .select("id, image_url, campaign_id")
      .eq("id", id)
      .single();

    if (checkError || !existingAsset) {
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    // Try to delete from storage if it's a Supabase storage URL
    // Storage path convention: assets/{campaign_id}/{uuid}.{ext}
    const imageUrl = existingAsset.image_url;
    if (imageUrl && imageUrl.includes('supabase') && imageUrl.includes('/storage/')) {
      try {
        // Extract storage path from URL
        // Format: .../storage/v1/object/public/assets/{campaign_id}/{filename}
        const storagePathMatch = imageUrl.match(/\/storage\/v1\/object\/public\/(.+)/);
        if (storagePathMatch) {
          const fullPath = storagePathMatch[1];
          const [bucket, ...pathParts] = fullPath.split('/');
          const filePath = pathParts.join('/');

          if (bucket && filePath) {
            await supabase.storage.from(bucket).remove([filePath]);
          }
        }
      } catch (storageError) {
        // Log but don't fail - storage deletion is best effort
        console.error("Storage deletion error:", storageError);
      }
    }

    // Delete asset record
    const { error: deleteError } = await supabase
      .from("assets")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete asset", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error) {
    console.error("DELETE /api/assets/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
