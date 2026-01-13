import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { ProductWithImages } from "@/lib/supabase/database.types";
import { ProductProfileClient } from "./client";

interface ProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch product
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (productError || !product) {
    notFound();
  }

  // Fetch images
  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .eq("product_id", id)
    .order("sort_order", { ascending: true });

  // Fetch brand name
  const { data: brand } = await supabase
    .from("brands")
    .select("id, name")
    .eq("id", product.brand_id)
    .single();

  const productWithImages: ProductWithImages = {
    ...product,
    images: images || [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to Products
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {product.name}
            </h1>
            {brand && (
              <Link
                href={`/brands/${brand.id}`}
                className="mt-1 text-sm text-blue-600 hover:text-blue-700"
              >
                {brand.name}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Client-side interactive sections */}
      <ProductProfileClient
        product={productWithImages}
        brandName={brand?.name}
      />
    </div>
  );
}
