import Link from "next/link";
import type { ProductWithImages } from "@/lib/supabase/database.types";

interface ProductCardProps {
  product: ProductWithImages;
  brandName?: string;
}

export function ProductCard({ product, brandName }: ProductCardProps) {
  const imageCount = product.images.length;
  const heroImage = product.images.find((img) => img.is_hero) || product.images[0];

  return (
    <Link href={`/products/${product.id}`}>
      <div className="rounded-lg border border-slate-200 bg-white shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer overflow-hidden">
        {/* Hero Image Thumbnail */}
        <div className="aspect-square w-full bg-slate-100 relative">
          {heroImage ? (
            <img
              src={heroImage.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <svg
                className="w-16 h-16 text-slate-300"
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
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-4">
          {/* Product Name */}
          <h3 className="text-base font-medium text-slate-900 truncate">
            {product.name}
          </h3>

          {/* Brand Name */}
          {brandName && (
            <p className="text-sm text-slate-500 mt-0.5 truncate">{brandName}</p>
          )}

          {/* Image Count */}
          <p className="text-xs text-slate-400 mt-2">
            {imageCount} {imageCount === 1 ? "image" : "images"}
          </p>
        </div>
      </div>
    </Link>
  );
}
