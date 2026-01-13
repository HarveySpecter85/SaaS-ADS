import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/product-card";
import type { Product, ProductWithImages } from "@/lib/supabase/database.types";

export default async function ProductsPage() {
  const supabase = await createClient();

  // Fetch all products
  const { data: products, error: productsError } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (productsError) {
    console.error("Error fetching products:", productsError);
    return (
      <div className="text-red-600">
        Error loading products. Please try again.
      </div>
    );
  }

  // Early return if no products
  if (!products || products.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
          <Link
            href="/products/new"
            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
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
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            Add Product
          </Link>
        </div>

        {/* Empty State */}
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No products yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Add product images to anchor your AI creatives.
          </p>
          <Link
            href="/products/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Add Your First Product
          </Link>
        </div>
      </div>
    );
  }

  // Fetch images for all products
  const productIds = products.map((p: Product) => p.id);
  const { data: images } = await supabase
    .from("product_images")
    .select("*")
    .in("product_id", productIds)
    .order("sort_order", { ascending: true });

  // Fetch brands for product names
  const brandIds = [...new Set(products.map((p: Product) => p.brand_id))];
  const { data: brands } = await supabase
    .from("brands")
    .select("id, name")
    .in("id", brandIds);

  // Create brand lookup map
  const brandMap = new Map<string, string>();
  brands?.forEach((brand: { id: string; name: string }) => {
    brandMap.set(brand.id, brand.name);
  });

  // Map images to products
  const productsWithImages: ProductWithImages[] = products.map(
    (product: Product) => ({
      ...product,
      images: images?.filter((img) => img.product_id === product.id) || [],
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Products</h1>
        <Link
          href="/products/new"
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
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
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add Product
        </Link>
      </div>

      {/* Product Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {productsWithImages.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            brandName={brandMap.get(product.brand_id)}
          />
        ))}
      </div>
    </div>
  );
}
