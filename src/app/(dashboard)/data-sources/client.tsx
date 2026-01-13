"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { DataSource, DataSourceType } from "@/lib/supabase/database.types";
import { DataSourceCard } from "@/components/data-source-card";

interface DataSourcesClientProps {
  dataSources: DataSource[];
}

// Type filter options
const typeOptions: Array<{ value: DataSourceType | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "weather", label: "Weather" },
  { value: "calendar", label: "Calendar" },
  { value: "custom", label: "Custom" },
];

export function DataSourcesClient({ dataSources }: DataSourcesClientProps) {
  const [selectedType, setSelectedType] = useState<DataSourceType | "all">("all");

  // Filter data sources by type
  const filteredDataSources = useMemo(() => {
    if (selectedType === "all") {
      return dataSources;
    }
    return dataSources.filter((ds) => ds.type === selectedType);
  }, [dataSources, selectedType]);

  // Empty state - no data sources at all
  if (dataSources.length === 0) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Data Sources</h1>
          <Link
            href="/data-sources/new"
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
            Add Data Source
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
              d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No data sources yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Connect external data to power contextual ad triggers.
          </p>
          <Link
            href="/data-sources/new"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Add Data Source
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Data Sources</h1>
          <p className="text-sm text-slate-500 mt-1">
            {filteredDataSources.length} {filteredDataSources.length === 1 ? "source" : "sources"}
            {selectedType !== "all" && " (filtered)"}
          </p>
        </div>
        <Link
          href="/data-sources/new"
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
          Add Data Source
        </Link>
      </div>

      {/* Type Filter Pills */}
      <div className="flex items-center gap-2">
        {typeOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => setSelectedType(option.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedType === option.value
                ? "bg-slate-900 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Data Source Grid */}
      {filteredDataSources.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDataSources.map((dataSource) => (
            <DataSourceCard key={dataSource.id} dataSource={dataSource} />
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
              d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No matching data sources
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Try a different filter to find what you&apos;re looking for.
          </p>
          <button
            onClick={() => setSelectedType("all")}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Clear Filter
          </button>
        </div>
      )}
    </div>
  );
}
