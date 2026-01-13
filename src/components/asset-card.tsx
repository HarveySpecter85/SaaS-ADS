"use client";

import type { Asset, AssetFormat, AdPlatform } from "@/lib/supabase/database.types";

interface AssetCardProps {
  asset: Asset;
  isSelected: boolean;
  onSelect: (assetId: string, shiftKey: boolean) => void;
  onClick: (asset: Asset) => void;
}

// Format badge colors
const formatColors: Record<AssetFormat, { bg: string; text: string }> = {
  png: { bg: "bg-purple-100", text: "text-purple-700" },
  jpg: { bg: "bg-amber-100", text: "text-amber-700" },
  webp: { bg: "bg-teal-100", text: "text-teal-700" },
};

// Platform badge colors
const platformColors: Record<AdPlatform, { bg: string; text: string; label: string }> = {
  google_ads: { bg: "bg-blue-100", text: "text-blue-700", label: "Google Ads" },
  meta: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Meta" },
  tiktok: { bg: "bg-rose-100", text: "text-rose-700", label: "TikTok" },
};

export function AssetCard({ asset, isSelected, onSelect, onClick }: AssetCardProps) {
  const format = formatColors[asset.format];
  const platform = asset.platform ? platformColors[asset.platform] : null;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(asset.id, e.shiftKey);
  };

  const handleCardClick = () => {
    onClick(asset);
  };

  return (
    <div
      className={`group relative rounded-lg overflow-hidden bg-slate-100 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-lg ${
        isSelected ? "ring-2 ring-blue-500 ring-offset-2" : ""
      }`}
      onClick={handleCardClick}
    >
      {/* Checkbox - always visible when selected, show on hover otherwise */}
      <div
        className={`absolute top-2 left-2 z-10 ${
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        } transition-opacity`}
        onClick={handleCheckboxClick}
      >
        <div
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
            isSelected
              ? "bg-blue-500 border-blue-500"
              : "bg-white/90 border-slate-300 hover:border-blue-400"
          }`}
        >
          {isSelected && (
            <svg
              className="w-3 h-3 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={3}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>

      {/* Image thumbnail */}
      <div className="aspect-video w-full">
        <img
          src={asset.image_url}
          alt={`Asset ${asset.id}`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Hover overlay with info */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Dimensions */}
          <p className="text-white text-sm font-medium mb-2">
            {asset.width} x {asset.height}
          </p>

          {/* Badges */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Format badge */}
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${format.bg} ${format.text}`}
            >
              {asset.format.toUpperCase()}
            </span>

            {/* Platform badge */}
            {platform && (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${platform.bg} ${platform.text}`}
              >
                {platform.label}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Selected overlay */}
      {isSelected && (
        <div className="absolute inset-0 bg-blue-500/10 pointer-events-none" />
      )}
    </div>
  );
}
