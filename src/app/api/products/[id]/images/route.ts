import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ProductImage } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// POST: Upload new image for product
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!isValidUUID(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Validate product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const angle = formData.get("angle") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file is an image
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "File must be an image (image/*)" },
        { status: 400 }
      );
    }

    // Generate unique filename
    const fileExt = file.name.split(".").pop() || "jpg";
    const uniqueId = crypto.randomUUID();
    const fileName = `${uniqueId}.${fileExt}`;
    const storagePath = `products/${productId}/${fileName}`;

    // Convert file to buffer for upload
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("product-images")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json(
        { error: "Failed to upload image", details: uploadError.message },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from("product-images")
      .getPublicUrl(storagePath);

    const imageUrl = urlData.publicUrl;

    // Check if this should be hero (first image or no existing hero)
    const { data: existingImages } = await supabase
      .from("product_images")
      .select("id, is_hero")
      .eq("product_id", productId);

    const hasHero = existingImages?.some((img) => img.is_hero) || false;
    const isHero = !hasHero; // First image or no hero = make this hero

    // Get next sort_order
    const maxSortOrder = existingImages?.length || 0;

    // Create product_images record
    const { data: imageRecord, error: insertError } = await supabase
      .from("product_images")
      .insert({
        product_id: productId,
        image_url: imageUrl,
        is_hero: isHero,
        angle: angle || null,
        sort_order: maxSortOrder,
      })
      .select()
      .single();

    if (insertError) {
      // Try to clean up uploaded file
      await supabase.storage.from("product-images").remove([storagePath]);
      return NextResponse.json(
        { error: "Failed to create image record", details: insertError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(imageRecord, { status: 201 });
  } catch (error) {
    console.error("POST /api/products/[id]/images error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Remove specific image (via query param ?image_id=uuid)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params;

    if (!isValidUUID(productId)) {
      return NextResponse.json(
        { error: "Invalid product ID format" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("image_id");

    if (!imageId) {
      return NextResponse.json(
        { error: "image_id query parameter is required" },
        { status: 400 }
      );
    }

    if (!isValidUUID(imageId)) {
      return NextResponse.json(
        { error: "Invalid image_id format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Get the image to delete
    const { data: imageToDelete, error: fetchError } = await supabase
      .from("product_images")
      .select("*")
      .eq("id", imageId)
      .eq("product_id", productId)
      .single();

    if (fetchError || !imageToDelete) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // Extract storage path from URL
    const imageUrl = imageToDelete.image_url;
    const storagePath = extractStoragePath(imageUrl);

    // Delete from storage if path extracted
    if (storagePath) {
      await supabase.storage.from("product-images").remove([storagePath]);
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from("product_images")
      .delete()
      .eq("id", imageId);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete image", details: deleteError.message },
        { status: 500 }
      );
    }

    // If deleted image was hero, promote next image to hero
    if (imageToDelete.is_hero) {
      const { data: remainingImages } = await supabase
        .from("product_images")
        .select("id")
        .eq("product_id", productId)
        .order("sort_order", { ascending: true })
        .limit(1);

      if (remainingImages && remainingImages.length > 0) {
        await supabase
          .from("product_images")
          .update({ is_hero: true })
          .eq("id", remainingImages[0].id);
      }
    }

    return NextResponse.json({ success: true, deleted_id: imageId });
  } catch (error) {
    console.error("DELETE /api/products/[id]/images error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper to extract storage path from public URL
function extractStoragePath(publicUrl: string): string | null {
  try {
    // URL format: {supabase_url}/storage/v1/object/public/product-images/{path}
    const match = publicUrl.match(/\/product-images\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
