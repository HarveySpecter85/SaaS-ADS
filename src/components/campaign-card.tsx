import Link from "next/link";
import type { Campaign, CampaignGoal, CampaignStatus } from "@/lib/supabase/database.types";

// Extended campaign type with prompt count from API
interface CampaignWithCount extends Campaign {
  prompt_count: number;
}

interface CampaignCardProps {
  campaign: CampaignWithCount;
  productName?: string;
}

// Goal badge colors
const goalColors: Record<CampaignGoal, { bg: string; text: string; label: string }> = {
  awareness: { bg: "bg-blue-100", text: "text-blue-700", label: "Awareness" },
  lead_gen: { bg: "bg-green-100", text: "text-green-700", label: "Lead Gen" },
  conversion: { bg: "bg-orange-100", text: "text-orange-700", label: "Conversion" },
};

// Status badge styles
const statusStyles: Record<CampaignStatus, { bg: string; text: string; label: string }> = {
  draft: { bg: "bg-slate-100", text: "text-slate-600", label: "Draft" },
  generating: { bg: "bg-purple-100", text: "text-purple-700", label: "Generating" },
  complete: { bg: "bg-emerald-100", text: "text-emerald-700", label: "Complete" },
};

export function CampaignCard({ campaign, productName }: CampaignCardProps) {
  const goal = goalColors[campaign.goal];
  const status = statusStyles[campaign.status];
  const promptCount = campaign.prompt_count;

  return (
    <Link href={`/campaigns/${campaign.id}`}>
      <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer">
        {/* Header: Goal Badge + Status */}
        <div className="flex items-center justify-between mb-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${goal.bg} ${goal.text}`}>
            {goal.label}
          </span>
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.text}`}>
            {status.label}
          </span>
        </div>

        {/* Campaign Name */}
        <h3 className="text-lg font-medium text-slate-900 mb-1 truncate">
          {campaign.name}
        </h3>

        {/* Product Name */}
        {productName && (
          <p className="text-sm text-slate-500 mb-3 truncate">{productName}</p>
        )}

        {/* Prompt Count */}
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
              d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
            />
          </svg>
          <span className="text-sm text-slate-600">
            {promptCount > 0 ? `${promptCount} prompts` : "Draft"}
          </span>
        </div>
      </div>
    </Link>
  );
}
