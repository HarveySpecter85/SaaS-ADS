import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { BrandWithRelations } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET: Get a single brand with all relations
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
        { error: "Invalid brand ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch brand
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Fetch related data
    const [colorsRes, fontsRes, toneRes] = await Promise.all([
      supabase.from("brand_colors").select("*").eq("brand_id", id),
      supabase.from("brand_fonts").select("*").eq("brand_id", id),
      supabase.from("brand_tone").select("*").eq("brand_id", id),
    ]);

    const brandWithRelations: BrandWithRelations = {
      ...brand,
      colors: colorsRes.data || [],
      fonts: fontsRes.data || [],
      tone: toneRes.data || [],
    };

    return NextResponse.json(brandWithRelations);
  } catch (error) {
    console.error("GET /api/brands/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update brand and/or nested relations
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid brand ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Check if brand exists
    const { data: existingBrand, error: checkError } = await supabase
      .from("brands")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Update brand fields if provided
    const { name, description, source_pdf_url, colors, fonts, tone } = body;

    if (name !== undefined || description !== undefined || source_pdf_url !== undefined) {
      const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name !== undefined) updateData.name = name;
      if (description !== undefined) updateData.description = description;
      if (source_pdf_url !== undefined) updateData.source_pdf_url = source_pdf_url;

      const { error: updateError } = await supabase
        .from("brands")
        .update(updateData)
        .eq("id", id);

      if (updateError) {
        return NextResponse.json(
          { error: "Failed to update brand", details: updateError.message },
          { status: 500 }
        );
      }
    }

    // Handle colors update (replace all)
    if (colors !== undefined) {
      await supabase.from("brand_colors").delete().eq("brand_id", id);
      if (colors.length > 0) {
        const colorsWithBrandId = colors.map((c: { hex_code: string; name?: string; usage?: string; is_primary?: boolean }) => ({
          ...c,
          brand_id: id,
        }));
        await supabase.from("brand_colors").insert(colorsWithBrandId);
      }
    }

    // Handle fonts update (replace all)
    if (fonts !== undefined) {
      await supabase.from("brand_fonts").delete().eq("brand_id", id);
      if (fonts.length > 0) {
        const fontsWithBrandId = fonts.map((f: { font_family: string; font_weight?: string; usage?: string; is_primary?: boolean }) => ({
          ...f,
          brand_id: id,
        }));
        await supabase.from("brand_fonts").insert(fontsWithBrandId);
      }
    }

    // Handle tone update (replace all)
    if (tone !== undefined) {
      await supabase.from("brand_tone").delete().eq("brand_id", id);
      if (tone.length > 0) {
        const toneWithBrandId = tone.map((t: { descriptor: string; example?: string }) => ({
          ...t,
          brand_id: id,
        }));
        await supabase.from("brand_tone").insert(toneWithBrandId);
      }
    }

    // Fetch and return updated brand with relations
    const { data: updatedBrand } = await supabase
      .from("brands")
      .select("*")
      .eq("id", id)
      .single();

    const [colorsRes, fontsRes, toneRes] = await Promise.all([
      supabase.from("brand_colors").select("*").eq("brand_id", id),
      supabase.from("brand_fonts").select("*").eq("brand_id", id),
      supabase.from("brand_tone").select("*").eq("brand_id", id),
    ]);

    const brandWithRelations: BrandWithRelations = {
      ...updatedBrand,
      colors: colorsRes.data || [],
      fonts: fontsRes.data || [],
      tone: toneRes.data || [],
    };

    return NextResponse.json(brandWithRelations);
  } catch (error) {
    console.error("PATCH /api/brands/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete brand (cascades to colors/fonts/tone)
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
        { error: "Invalid brand ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if brand exists
    const { data: existingBrand, error: checkError } = await supabase
      .from("brands")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingBrand) {
      return NextResponse.json({ error: "Brand not found" }, { status: 404 });
    }

    // Delete brand (cascade will handle related tables)
    const { error: deleteError } = await supabase
      .from("brands")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete brand", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error) {
    console.error("DELETE /api/brands/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
