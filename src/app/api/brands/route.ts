import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { Brand, BrandWithRelations } from "@/lib/supabase/database.types";

// GET: List all brands with their colors, fonts, and tone
export async function GET() {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();

    // Fetch all brands
    const { data: brands, error: brandsError } = await supabase
      .from("brands")
      .select("*")
      .order("created_at", { ascending: false });

    if (brandsError) {
      return NextResponse.json(
        { error: "Failed to fetch brands", details: brandsError.message },
        { status: 500 }
      );
    }

    // Fetch related data for all brands
    const brandIds = brands.map((b: Brand) => b.id);

    const [colorsRes, fontsRes, toneRes] = await Promise.all([
      supabase.from("brand_colors").select("*").in("brand_id", brandIds),
      supabase.from("brand_fonts").select("*").in("brand_id", brandIds),
      supabase.from("brand_tone").select("*").in("brand_id", brandIds),
    ]);

    // Map related data to brands
    const brandsWithRelations: BrandWithRelations[] = brands.map(
      (brand: Brand) => ({
        ...brand,
        colors: colorsRes.data?.filter((c) => c.brand_id === brand.id) || [],
        fonts: fontsRes.data?.filter((f) => f.brand_id === brand.id) || [],
        tone: toneRes.data?.filter((t) => t.brand_id === brand.id) || [],
      })
    );

    return NextResponse.json(brandsWithRelations);
  } catch (error) {
    console.error("GET /api/brands error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new brand
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, description, source_pdf_url } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    const { data: brand, error } = await supabase
      .from("brands")
      .insert({
        name,
        description: description || null,
        source_pdf_url: source_pdf_url || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create brand", details: error.message },
        { status: 500 }
      );
    }

    // Return brand with empty relations
    const brandWithRelations: BrandWithRelations = {
      ...brand,
      colors: [],
      fonts: [],
      tone: [],
    };

    return NextResponse.json(brandWithRelations, { status: 201 });
  } catch (error) {
    console.error("POST /api/brands error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
