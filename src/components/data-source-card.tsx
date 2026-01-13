import Link from "next/link";
import type { DataSource, DataSourceType, WeatherConfig } from "@/lib/supabase/database.types";

interface DataSourceCardProps {
  dataSource: DataSource;
}

// Type badge colors
const typeColors: Record<DataSourceType, { bg: string; text: string; label: string }> = {
  weather: { bg: "bg-blue-100", text: "text-blue-700", label: "Weather" },
  calendar: { bg: "bg-purple-100", text: "text-purple-700", label: "Calendar" },
  custom: { bg: "bg-amber-100", text: "text-amber-700", label: "Custom" },
};

// Get config summary based on type
function getConfigSummary(dataSource: DataSource): string {
  switch (dataSource.type) {
    case "weather": {
      const config = dataSource.config as WeatherConfig;
      return config.location || "No location set";
    }
    case "calendar":
      return "Events configured";
    case "custom":
      return "Custom data";
    default:
      return "";
  }
}

// Format relative time
function formatLastSync(dateString: string | null): string {
  if (!dateString) return "Never synced";

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function DataSourceCard({ dataSource }: DataSourceCardProps) {
  const type = typeColors[dataSource.type];
  const configSummary = getConfigSummary(dataSource);
  const lastSync = formatLastSync(dataSource.last_sync_at);

  return (
    <Link href={`/data-sources/${dataSource.id}`}>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
        {/* Header: Type Badge + Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${type.bg} ${type.text}`}>
            {type.label}
          </span>
          <div className="flex items-center gap-1.5">
            <span
              className={`w-2 h-2 rounded-full ${
                dataSource.is_active ? "bg-green-500" : "bg-slate-300"
              }`}
            />
            <span className="text-xs text-slate-500">
              {dataSource.is_active ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Data Source Name */}
        <h3 className="text-lg font-medium text-slate-900 mb-1 truncate">
          {dataSource.name}
        </h3>

        {/* Config Summary */}
        <p className="text-sm text-slate-500 mb-3 truncate">{configSummary}</p>

        {/* Last Sync */}
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm text-slate-600">{lastSync}</span>
        </div>
      </div>
    </Link>
  );
}
