'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ProductRecommendationProps {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
}

export function ProductRecommendation({
  id,
  name,
  description,
  imageUrl,
}: ProductRecommendationProps) {
  return (
    <Link
      href={`/products/${id}`}
      className="block bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
    >
      {/* Product image */}
      <div className="aspect-square relative bg-gray-100">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>

      {/* Product info */}
      <div className="p-3">
        <h4 className="font-medium text-gray-900 text-sm truncate">
          {name}
        </h4>
        {description && (
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {description}
          </p>
        )}
      </div>
    </Link>
  );
}

// Grid of recommendations
interface ProductRecommendationsProps {
  products: ProductRecommendationProps[];
}

export function ProductRecommendations({ products }: ProductRecommendationsProps) {
  if (!products.length) return null;

  return (
    <div className="mt-2">
      <p className="text-xs text-gray-500 mb-2">Recommended for you:</p>
      <div className="grid grid-cols-2 gap-2">
        {products.map(product => (
          <ProductRecommendation key={product.id} {...product} />
        ))}
      </div>
    </div>
  );
}
