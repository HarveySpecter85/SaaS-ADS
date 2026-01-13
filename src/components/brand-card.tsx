import Link from "next/link";
import type { BrandWithRelations } from "@/lib/supabase/database.types";

interface BrandCardProps {
  brand: BrandWithRelations;
}

export function BrandCard({ brand }: BrandCardProps) {
  const colorCount = brand.colors.length;
  const fontCount = brand.fonts.length;
  const primaryFont = brand.fonts.find((f) => f.is_primary) || brand.fonts[0];

  // Get first 3 colors for preview
  const previewColors = brand.colors.slice(0, 3);

  return (
    <Link href={`/brands/${brand.id}`}>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
        {/* Brand Name */}
        <h3 className="text-lg font-medium text-slate-900 mb-3">
          {brand.name}
        </h3>

        {/* Color Swatches Preview */}
        <div className="flex gap-2 mb-3">
          {previewColors.length > 0 ? (
            previewColors.map((color) => (
              <div
                key={color.id}
                className="h-8 w-8 rounded-md border border-slate-200"
                style={{ backgroundColor: color.hex_code }}
                title={color.name || color.hex_code}
              />
            ))
          ) : (
            <div className="h-8 w-8 rounded-md border border-dashed border-slate-300 bg-slate-50" />
          )}
          {brand.colors.length > 3 && (
            <div className="h-8 w-8 rounded-md border border-slate-200 bg-slate-50 flex items-center justify-center text-xs text-slate-500">
              +{brand.colors.length - 3}
            </div>
          )}
        </div>

        {/* Primary Font */}
        {primaryFont && (
          <p className="text-sm text-slate-600 mb-2">
            {primaryFont.font_family}
          </p>
        )}

        {/* Item Counts */}
        <p className="text-xs text-slate-500">
          {colorCount} {colorCount === 1 ? "color" : "colors"} · {fontCount}{" "}
          {fontCount === 1 ? "font" : "fonts"}
        </p>
      </div>
    </Link>
  );
}
