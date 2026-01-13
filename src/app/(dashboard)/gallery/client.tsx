"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import type { Campaign, Asset, Prompt, CampaignGoal, AdPlatform, AssetFormat } from "@/lib/supabase/database.types";
import { CampaignSection } from "@/components/campaign-section";
import { ExportModal } from "@/components/export-modal";

// Extended campaign type with product name and asset count
interface CampaignWithAssetCount extends Campaign {
  product_name: string;
  asset_count: number;
}

interface GalleryData {
  campaigns: CampaignWithAssetCount[];
  products: Array<{ id: string; name: string }>;
  assets: Asset[];
  prompts: Prompt[];
}

interface GalleryClientProps {
  data: GalleryData;
}

// Goal filter options
const goalOptions: Array<{ value: CampaignGoal | "all"; label: string }> = [
  { value: "all", label: "All Goals" },
  { value: "awareness", label: "Awareness" },
  { value: "lead_gen", label: "Lead Gen" },
  { value: "conversion", label: "Conversion" },
];

// Format badge colors for lightbox
const formatColors: Record<AssetFormat, { bg: string; text: string }> = {
  png: { bg: "bg-purple-100", text: "text-purple-700" },
  jpg: { bg: "bg-amber-100", text: "text-amber-700" },
  webp: { bg: "bg-teal-100", text: "text-teal-700" },
};

// Platform badge colors for lightbox
const platformColors: Record<AdPlatform, { bg: string; text: string; label: string }> = {
  google_ads: { bg: "bg-blue-100", text: "text-blue-700", label: "Google Ads" },
  meta: { bg: "bg-indigo-100", text: "text-indigo-700", label: "Meta" },
  tiktok: { bg: "bg-rose-100", text: "text-rose-700", label: "TikTok" },
};

export function GalleryClient({ data }: GalleryClientProps) {
  const { campaigns, products, assets, prompts } = data;

  // Filter state
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("all");
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | "all">("all");
  const [selectedProductId, setSelectedProductId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Selection state
  const [selectedAssetIds, setSelectedAssetIds] = useState<Set<string>>(new Set());

  // Track last selected asset for shift-click range selection
  const [lastSelectedAssetId, setLastSelectedAssetId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxAsset, setLightboxAsset] = useState<Asset | null>(null);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  // Toast notification state
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // Create maps for quick lookups
  const assetsByCampaign = useMemo(() => {
    const map = new Map<string, Asset[]>();
    assets.forEach((asset) => {
      const list = map.get(asset.campaign_id) || [];
      list.push(asset);
      map.set(asset.campaign_id, list);
    });
    return map;
  }, [assets]);

  const promptsById = useMemo(() => {
    const map = new Map<string, Prompt>();
    prompts.forEach((prompt) => {
      map.set(prompt.id, prompt);
    });
    return map;
  }, [prompts]);

  // Filter campaigns based on selected filters
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      // Filter by specific campaign
      if (selectedCampaignId !== "all" && campaign.id !== selectedCampaignId) {
        return false;
      }

      // Filter by goal
      if (selectedGoal !== "all" && campaign.goal !== selectedGoal) {
        return false;
      }

      // Filter by product
      if (selectedProductId !== "all" && campaign.product_id !== selectedProductId) {
        return false;
      }

      // Filter by search query (search in prompt headlines/descriptions)
      if (searchQuery.trim()) {
        const campaignAssets = assetsByCampaign.get(campaign.id) || [];
        const matchingAssets = campaignAssets.some((asset) => {
          const prompt = promptsById.get(asset.prompt_id);
          if (!prompt) return false;
          const searchLower = searchQuery.toLowerCase();
          return (
            prompt.headline?.toLowerCase().includes(searchLower) ||
            prompt.description?.toLowerCase().includes(searchLower) ||
            prompt.prompt_text?.toLowerCase().includes(searchLower)
          );
        });
        if (!matchingAssets && campaignAssets.length > 0) {
          return false;
        }
      }

      return true;
    });
  }, [campaigns, selectedCampaignId, selectedGoal, selectedProductId, searchQuery, assetsByCampaign, promptsById]);

  // Get filtered assets for each campaign (respecting search)
  const getFilteredAssetsForCampaign = (campaignId: string): Asset[] => {
    const campaignAssets = assetsByCampaign.get(campaignId) || [];

    if (!searchQuery.trim()) {
      return campaignAssets;
    }

    return campaignAssets.filter((asset) => {
      const prompt = promptsById.get(asset.prompt_id);
      if (!prompt) return false;
      const searchLower = searchQuery.toLowerCase();
      return (
        prompt.headline?.toLowerCase().includes(searchLower) ||
        prompt.description?.toLowerCase().includes(searchLower) ||
        prompt.prompt_text?.toLowerCase().includes(searchLower)
      );
    });
  };

  // Total filtered assets count
  const totalFilteredAssets = filteredCampaigns.reduce((sum, campaign) => {
    return sum + getFilteredAssetsForCampaign(campaign.id).length;
  }, 0);

  // Check if any filters are active
  const hasActiveFilters =
    selectedCampaignId !== "all" ||
    selectedGoal !== "all" ||
    selectedProductId !== "all" ||
    searchQuery.trim() !== "";

  // Clear all filters
  const clearFilters = () => {
    setSelectedCampaignId("all");
    setSelectedGoal("all");
    setSelectedProductId("all");
    setSearchQuery("");
  };

  // Handle asset selection
  const handleAssetSelect = (assetId: string, shiftKey: boolean) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);

      if (shiftKey && lastSelectedAssetId) {
        // Range selection with shift
        const allVisibleAssets = filteredCampaigns.flatMap((c) =>
          getFilteredAssetsForCampaign(c.id)
        );
        const assetIds = allVisibleAssets.map((a) => a.id);
        const lastIndex = assetIds.indexOf(lastSelectedAssetId);
        const currentIndex = assetIds.indexOf(assetId);

        if (lastIndex !== -1 && currentIndex !== -1) {
          const start = Math.min(lastIndex, currentIndex);
          const end = Math.max(lastIndex, currentIndex);
          for (let i = start; i <= end; i++) {
            newSet.add(assetIds[i]);
          }
        }
      } else {
        // Toggle single selection
        if (newSet.has(assetId)) {
          newSet.delete(assetId);
        } else {
          newSet.add(assetId);
        }
      }

      return newSet;
    });
    setLastSelectedAssetId(assetId);
  };

  // Handle select all in campaign
  const handleSelectAllInCampaign = (campaignId: string, assetIds: string[]) => {
    setSelectedAssetIds((prev) => {
      const newSet = new Set(prev);
      const allSelected = assetIds.every((id) => newSet.has(id));

      if (allSelected) {
        // Deselect all
        assetIds.forEach((id) => newSet.delete(id));
      } else {
        // Select all
        assetIds.forEach((id) => newSet.add(id));
      }

      return newSet;
    });
  };

  // Handle asset click (open lightbox)
  const handleAssetClick = (asset: Asset) => {
    setLightboxAsset(asset);
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedAssetIds(new Set());
    setLastSelectedAssetId(null);
  };

  // Get selected assets for export
  const selectedAssets = useMemo(() => {
    return assets.filter((asset) => selectedAssetIds.has(asset.id));
  }, [assets, selectedAssetIds]);

  // Open export modal
  const openExportModal = () => {
    setIsExportModalOpen(true);
  };

  // Close export modal
  const closeExportModal = () => {
    setIsExportModalOpen(false);
  };

  // Handle export completion
  const handleExportComplete = (message: string) => {
    closeExportModal();
    // Show success toast
    setToast({ message, type: "success" });
    // Optionally clear selection after export
    clearSelection();
    // Auto-dismiss toast after 5 seconds
    setTimeout(() => setToast(null), 5000);
  };

  // Get assets in the same campaign as the lightbox asset for navigation
  const getLightboxNavigationAssets = useCallback((): Asset[] => {
    if (!lightboxAsset) return [];
    return assetsByCampaign.get(lightboxAsset.campaign_id) || [];
  }, [lightboxAsset, assetsByCampaign]);

  // Navigate to previous/next asset in lightbox
  const navigateLightbox = useCallback(
    (direction: "prev" | "next") => {
      if (!lightboxAsset) return;

      const campaignAssets = getLightboxNavigationAssets();
      const currentIndex = campaignAssets.findIndex(
        (a) => a.id === lightboxAsset.id
      );

      if (currentIndex === -1) return;

      let newIndex: number;
      if (direction === "prev") {
        newIndex = currentIndex > 0 ? currentIndex - 1 : campaignAssets.length - 1;
      } else {
        newIndex = currentIndex < campaignAssets.length - 1 ? currentIndex + 1 : 0;
      }

      setLightboxAsset(campaignAssets[newIndex]);
    },
    [lightboxAsset, getLightboxNavigationAssets]
  );

  // Close lightbox
  const closeLightbox = useCallback(() => {
    setLightboxAsset(null);
  }, []);

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (!lightboxAsset) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          closeLightbox();
          break;
        case "ArrowLeft":
          navigateLightbox("prev");
          break;
        case "ArrowRight":
          navigateLightbox("next");
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxAsset, navigateLightbox, closeLightbox]);

  // Get prompt for current lightbox asset
  const lightboxPrompt = lightboxAsset
    ? promptsById.get(lightboxAsset.prompt_id)
    : null;

  // Get navigation info for lightbox
  const lightboxNavInfo = useMemo(() => {
    if (!lightboxAsset) return null;
    const campaignAssets = assetsByCampaign.get(lightboxAsset.campaign_id) || [];
    const currentIndex = campaignAssets.findIndex(
      (a) => a.id === lightboxAsset.id
    );
    return {
      current: currentIndex + 1,
      total: campaignAssets.length,
      hasPrev: campaignAssets.length > 1,
      hasNext: campaignAssets.length > 1,
    };
  }, [lightboxAsset, assetsByCampaign]);

  // Empty state - no campaigns
  if (campaigns.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-900">Asset Gallery</h1>
        </div>

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
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            No assets yet
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            Generate assets from your campaigns to see them here.
          </p>
          <Link
            href="/campaigns"
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            Go to Campaigns
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
          <h1 className="text-2xl font-semibold text-slate-900">Asset Gallery</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalFilteredAssets} {totalFilteredAssets === 1 ? "asset" : "assets"}
            {hasActiveFilters && " (filtered)"}
          </p>
        </div>
      </div>

      {/* Filter Bar - Sticky */}
      <div className="sticky top-0 z-20 bg-white py-4 -mx-1 px-1 border-b border-slate-200">
        <div className="flex items-center gap-4 flex-wrap">
          {/* Campaign Dropdown */}
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Campaigns</option>
            {campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>

          {/* Goal Filter Pills */}
          <div className="flex items-center gap-1">
            {goalOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => setSelectedGoal(option.value)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedGoal === option.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Product Dropdown */}
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Products</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name}
              </option>
            ))}
          </select>

          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px]">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search by headline or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-md border border-slate-300 bg-white pl-10 pr-3 py-2 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Gallery Body - Campaign Sections */}
      <div className="space-y-6">
        {filteredCampaigns.length > 0 ? (
          filteredCampaigns.map((campaign) => {
            const campaignAssets = getFilteredAssetsForCampaign(campaign.id);
            return (
              <CampaignSection
                key={campaign.id}
                campaign={campaign}
                productName={campaign.product_name}
                assets={campaignAssets}
                selectedAssetIds={selectedAssetIds}
                onAssetSelect={handleAssetSelect}
                onAssetClick={handleAssetClick}
                onSelectAllInCampaign={handleSelectAllInCampaign}
              />
            );
          })
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
              No matching assets
            </h3>
            <p className="mt-2 text-sm text-slate-600">
              Try adjusting your filters to find what you&apos;re looking for.
            </p>
            <button
              onClick={clearFilters}
              className="mt-4 inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Bar - Selection Mode */}
      {selectedAssetIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <div className="flex items-center gap-4 bg-slate-900 text-white px-6 py-3 rounded-full shadow-xl">
            <span className="text-sm font-medium">
              {selectedAssetIds.size} selected
            </span>
            <div className="w-px h-5 bg-slate-700" />
            <button
              className="text-sm font-medium hover:text-blue-300 transition-colors"
              onClick={openExportModal}
            >
              Export
            </button>
            <button
              onClick={clearSelection}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Lightbox Modal with full metadata and navigation */}
      {lightboxAsset && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={closeLightbox}
        >
          {/* Close button */}
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 z-10 p-2 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Navigation arrows */}
          {lightboxNavInfo && lightboxNavInfo.hasPrev && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox("prev");
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-6 h-6"
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
            </button>
          )}

          {lightboxNavInfo && lightboxNavInfo.hasNext && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigateLightbox("next");
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.25 4.5l7.5 7.5-7.5 7.5"
                />
              </svg>
            </button>
          )}

          {/* Main content area */}
          <div
            className="flex flex-col lg:flex-row items-center gap-6 max-w-6xl max-h-[90vh] p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <img
                src={lightboxAsset.image_url}
                alt={`Asset ${lightboxAsset.id}`}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Metadata panel */}
            <div className="lg:w-80 w-full bg-white rounded-xl p-5 shadow-xl max-h-[70vh] overflow-y-auto">
              {/* Navigation counter */}
              {lightboxNavInfo && (
                <p className="text-xs text-slate-400 mb-3">
                  {lightboxNavInfo.current} of {lightboxNavInfo.total} in this campaign
                </p>
              )}

              {/* Dimensions */}
              <div className="mb-4">
                <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                  Dimensions
                </h4>
                <p className="text-lg font-semibold text-slate-900">
                  {lightboxAsset.width} x {lightboxAsset.height}
                </p>
              </div>

              {/* Format and Platform badges */}
              <div className="flex items-center gap-2 mb-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                    formatColors[lightboxAsset.format].bg
                  } ${formatColors[lightboxAsset.format].text}`}
                >
                  {lightboxAsset.format.toUpperCase()}
                </span>
                {lightboxAsset.platform && (
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${
                      platformColors[lightboxAsset.platform].bg
                    } ${platformColors[lightboxAsset.platform].text}`}
                  >
                    {platformColors[lightboxAsset.platform].label}
                  </span>
                )}
              </div>

              {/* Prompt info */}
              {lightboxPrompt && (
                <>
                  {lightboxPrompt.headline && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Headline
                      </h4>
                      <p className="text-sm text-slate-900 font-medium">
                        {lightboxPrompt.headline}
                      </p>
                    </div>
                  )}

                  {lightboxPrompt.description && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Description
                      </h4>
                      <p className="text-sm text-slate-700">
                        {lightboxPrompt.description}
                      </p>
                    </div>
                  )}

                  {lightboxPrompt.cta && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Call to Action
                      </h4>
                      <p className="text-sm text-slate-700">{lightboxPrompt.cta}</p>
                    </div>
                  )}

                  {lightboxPrompt.variation_type && (
                    <div className="mb-4">
                      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">
                        Variation Type
                      </h4>
                      <p className="text-sm text-slate-700 capitalize">
                        {lightboxPrompt.variation_type}
                      </p>
                    </div>
                  )}
                </>
              )}

              {/* Keyboard shortcuts hint */}
              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-xs text-slate-400">
                  Use arrow keys to navigate, Escape to close
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {isExportModalOpen && selectedAssets.length > 0 && (
        <ExportModal
          assets={selectedAssets}
          onClose={closeExportModal}
          onComplete={handleExportComplete}
        />
      )}

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg ${
              toast.type === "success"
                ? "bg-green-600 text-white"
                : "bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            )}
            <span className="text-sm font-medium">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
