import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { Product, ProductWithImages } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET: List all products (optionally filter by brand_id query param)
export async function GET(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const brandId = searchParams.get("brand_id");

    // Build query
    let query = supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    // Filter by brand_id if provided
    if (brandId) {
      if (!isValidUUID(brandId)) {
        return NextResponse.json(
          { error: "Invalid brand_id format" },
          { status: 400 }
        );
      }
      query = query.eq("brand_id", brandId);
    }

    const { data: products, error: productsError } = await query;

    if (productsError) {
      return NextResponse.json(
        { error: "Failed to fetch products", details: productsError.message },
        { status: 500 }
      );
    }

    // Fetch related images for all products
    const productIds = products.map((p: Product) => p.id);

    if (productIds.length === 0) {
      return NextResponse.json([]);
    }

    const { data: images } = await supabase
      .from("product_images")
      .select("*")
      .in("product_id", productIds)
      .order("sort_order", { ascending: true });

    // Map images to products
    const productsWithImages: ProductWithImages[] = products.map(
      (product: Product) => ({
        ...product,
        images: images?.filter((img) => img.product_id === product.id) || [],
      })
    );

    return NextResponse.json(productsWithImages);
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST: Create a new product
export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const supabase = await createClient();
    const body = await request.json();

    const { name, brand_id, description, sku } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Name is required" },
        { status: 400 }
      );
    }

    if (!brand_id) {
      return NextResponse.json(
        { error: "brand_id is required" },
        { status: 400 }
      );
    }

    if (!isValidUUID(brand_id)) {
      return NextResponse.json(
        { error: "Invalid brand_id format" },
        { status: 400 }
      );
    }

    // Verify brand exists
    const { data: brand, error: brandError } = await supabase
      .from("brands")
      .select("id")
      .eq("id", brand_id)
      .single();

    if (brandError || !brand) {
      return NextResponse.json(
        { error: "Brand not found" },
        { status: 404 }
      );
    }

    const { data: product, error } = await supabase
      .from("products")
      .insert({
        name,
        brand_id,
        description: description || null,
        sku: sku || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to create product", details: error.message },
        { status: 500 }
      );
    }

    // Return product with empty images array
    const productWithImages: ProductWithImages = {
      ...product,
      images: [],
    };

    return NextResponse.json(productWithImages, { status: 201 });
  } catch (error) {
    console.error("POST /api/products error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
