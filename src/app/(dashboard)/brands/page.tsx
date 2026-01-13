import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { BrandCard } from "@/components/brand-card";
import type { BrandWithRelations } from "@/lib/supabase/database.types";

export default async function BrandsPage() {
  const supabase = await createClient();

  // Fetch all brands
  const { data: brands, error: brandsError } = await supabase
    .from("brands")
    .select("*")
    .order("created_at", { ascending: false });

  if (brandsError) {
    console.error("Error fetching brands:", brandsError);
    return (
      <div className="text-red-600">
        Error loading brands. Please try again.
      </div>
    );
  }

  // Fetch related data for all brands in parallel
  const brandsWithRelations: BrandWithRelations[] = await Promise.all(
    (brands || []).map(async (brand) => {
      const [colorsRes, fontsRes, toneRes] = await Promise.all([
        supabase
          .from("brand_colors")
          .select("*")
          .eq("brand_id", brand.id)
          .order("is_primary", { ascending: false }),
        supabase
          .from("brand_fonts")
          .select("*")
          .eq("brand_id", brand.id)
          .order("is_primary", { ascending: false }),
        supabase.from("brand_tone").select("*").eq("brand_id", brand.id),
      ]);

      return {
        ...brand,
        colors: colorsRes.data || [],
        fonts: fontsRes.data || [],
        tone: toneRes.data || [],
      };
    })
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Brands</h1>
        <Link
          href="/brands/new"
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
          Upload New
        </Link>
      </div>

      {/* Brand Grid or Empty State */}
      {brandsWithRelations.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brandsWithRelations.map((brand) => (
            <BrandCard key={brand.id} brand={brand} />
          ))}
        </div>
      ) : (
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
              d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No brands yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Upload brand guidelines to get started.
          </p>
          <Link
            href="/brands/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Upload Brand Guidelines
          </Link>
        </div>
      )}
    </div>
  );
}
