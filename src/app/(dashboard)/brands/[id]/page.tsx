import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { BrandWithRelations } from "@/lib/supabase/database.types";
import { BrandProfileClient } from "./client";

interface BrandPageProps {
  params: Promise<{ id: string }>;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch brand
  const { data: brand, error: brandError } = await supabase
    .from("brands")
    .select("*")
    .eq("id", id)
    .single();

  if (brandError || !brand) {
    notFound();
  }

  // Fetch related data in parallel
  const [colorsRes, fontsRes, toneRes] = await Promise.all([
    supabase
      .from("brand_colors")
      .select("*")
      .eq("brand_id", id)
      .order("is_primary", { ascending: false }),
    supabase
      .from("brand_fonts")
      .select("*")
      .eq("brand_id", id)
      .order("is_primary", { ascending: false }),
    supabase.from("brand_tone").select("*").eq("brand_id", id),
  ]);

  const brandWithRelations: BrandWithRelations = {
    ...brand,
    colors: colorsRes.data || [],
    fonts: fontsRes.data || [],
    tone: toneRes.data || [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/brands"
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
          Back to Brands
        </Link>

        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              {brand.name}
            </h1>
            {brand.description && (
              <p className="mt-1 text-slate-600">{brand.description}</p>
            )}
          </div>

          {brand.source_pdf_url && (
            <a
              href={brand.source_pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
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
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3"
                />
              </svg>
              Download PDF
            </a>
          )}
        </div>
      </div>

      {/* Client-side interactive sections */}
      <BrandProfileClient brand={brandWithRelations} />
    </div>
  );
}
