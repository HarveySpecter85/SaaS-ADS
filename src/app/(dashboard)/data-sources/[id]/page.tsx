import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { DataSourceWithValues, DataSourceValue } from "@/lib/supabase/database.types";
import { DataSourceDetailClient } from "./client";

interface DataSourcePageProps {
  params: Promise<{ id: string }>;
}

export default async function DataSourcePage({ params }: DataSourcePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  // Fetch data source
  const { data: dataSource, error: dataSourceError } = await supabase
    .from("data_sources")
    .select("*")
    .eq("id", id)
    .single();

  if (dataSourceError || !dataSource) {
    notFound();
  }

  // Fetch related values
  const { data: values } = await supabase
    .from("data_source_values")
    .select("*")
    .eq("data_source_id", id)
    .order("created_at", { ascending: true });

  const dataSourceWithValues: DataSourceWithValues = {
    ...dataSource,
    values: (values as DataSourceValue[]) || [],
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/data-sources"
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
          Back to Data Sources
        </Link>
      </div>

      {/* Client-side interactive sections */}
      <DataSourceDetailClient dataSource={dataSourceWithValues} />
    </div>
  );
}
