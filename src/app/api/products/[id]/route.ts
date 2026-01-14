import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/api-auth";
import type { ProductWithImages } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// GET: Get a single product with all images
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
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Fetch product
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Fetch images sorted by sort_order
    const { data: images } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    const productWithImages: ProductWithImages = {
      ...product,
      images: images || [],
    };

    return NextResponse.json(productWithImages);
  } catch (error) {
    console.error("GET /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PATCH: Update product metadata (name, description, sku)
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
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Update product fields if provided
    const { name, description, sku } = body;

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sku !== undefined) updateData.sku = sku;

    const { error: updateError } = await supabase
      .from("products")
      .update(updateData)
      .eq("id", id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update product", details: updateError.message },
        { status: 500 }
      );
    }

    // Fetch and return updated product with images
    const { data: updatedProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    const { data: images } = await supabase
      .from("product_images")
      .select("*")
      .eq("product_id", id)
      .order("sort_order", { ascending: true });

    const productWithImages: ProductWithImages = {
      ...updatedProduct,
      images: images || [],
    };

    return NextResponse.json(productWithImages);
  } catch (error) {
    console.error("PATCH /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Delete product (cascades to images)
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
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if product exists
    const { data: existingProduct, error: checkError } = await supabase
      .from("products")
      .select("id")
      .eq("id", id)
      .single();

    if (checkError || !existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Delete product (cascade will handle images)
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete product", details: deleteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, deleted_id: id });
  } catch (error) {
    console.error("DELETE /api/products/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
