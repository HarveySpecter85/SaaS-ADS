"use client";

import { useState } from "react";
import type { Campaign, Asset, CampaignGoal } from "@/lib/supabase/database.types";
import { AssetCard } from "./asset-card";

interface CampaignSectionProps {
  campaign: Campaign;
  productName: string;
  assets: Asset[];
  selectedAssetIds: Set<string>;
  onAssetSelect: (assetId: string, shiftKey: boolean) => void;
  onAssetClick: (asset: Asset) => void;
  onSelectAllInCampaign: (campaignId: string, assetIds: string[]) => void;
}

// Goal badge colors
const goalColors: Record<CampaignGoal, { bg: string; text: string; label: string }> = {
  awareness: { bg: "bg-blue-100", text: "text-blue-700", label: "Awareness" },
  lead_gen: { bg: "bg-green-100", text: "text-green-700", label: "Lead Gen" },
  conversion: { bg: "bg-orange-100", text: "text-orange-700", label: "Conversion" },
};

export function CampaignSection({
  campaign,
  productName,
  assets,
  selectedAssetIds,
  onAssetSelect,
  onAssetClick,
  onSelectAllInCampaign,
}: CampaignSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const goal = goalColors[campaign.goal];

  const assetIds = assets.map(a => a.id);
  const selectedInCampaign = assetIds.filter(id => selectedAssetIds.has(id)).length;
  const allSelected = selectedInCampaign === assets.length && assets.length > 0;

  const handleSelectAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectAllInCampaign(campaign.id, assetIds);
  };

  return (
    <section className="rounded-xl border border-slate-200 bg-white overflow-hidden">
      {/* Section Header - Clickable to collapse/expand */}
      <div
        className="flex items-center justify-between p-4 bg-slate-50/50 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-4">
          {/* Collapse/Expand Icon */}
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform ${
              isCollapsed ? "-rotate-90" : ""
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>

          <div>
            {/* Campaign Name */}
            <h2 className="text-lg font-semibold text-slate-900">
              {campaign.name}
            </h2>

            {/* Product Name */}
            <p className="text-sm text-slate-500">{productName}</p>
          </div>

          {/* Goal Badge */}
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${goal.bg} ${goal.text}`}
          >
            {goal.label}
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* Asset Count */}
          <span className="text-sm text-slate-600">
            {assets.length} {assets.length === 1 ? "asset" : "assets"}
          </span>

          {/* Select All Button */}
          {assets.length > 0 && (
            <button
              onClick={handleSelectAll}
              className={`text-xs px-3 py-1 rounded-md transition-colors ${
                allSelected
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {allSelected ? "Deselect All" : "Select All"}
            </button>
          )}
        </div>
      </div>

      {/* Assets Grid */}
      {!isCollapsed && (
        <div className="p-4">
          {assets.length > 0 ? (
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {assets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  isSelected={selectedAssetIds.has(asset.id)}
                  onSelect={onAssetSelect}
                  onClick={onAssetClick}
                />
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-500">
              <svg
                className="mx-auto h-12 w-12 text-slate-300 mb-3"
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
              <p className="text-sm">No assets generated yet</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
