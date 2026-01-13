"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { CampaignWithPrompts, CampaignGoal, CampaignStatus, Prompt } from "@/lib/supabase/database.types";
import { PromptCard } from "@/components/prompt-card";

interface CampaignProfileClientProps {
  campaign: CampaignWithPrompts;
  productName?: string;
  productId?: string;
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

// Variation types for filtering
const variationTypes = [
  "all",
  "brand_story",
  "lifestyle_context",
  "emotional_appeal",
  "aspirational",
  "benefit_driven",
  "problem_solution",
  "social_proof",
  "curiosity_hook",
  "urgency_driven",
  "benefit_stack",
  "testimonial_style",
  "limited_offer",
];

export function CampaignProfileClient({
  campaign,
  productName,
  productId,
}: CampaignProfileClientProps) {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [name, setName] = useState(campaign.name);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [currentStatus, setCurrentStatus] = useState<CampaignStatus>(campaign.status);

  const goal = goalColors[campaign.goal];
  const status = statusStyles[currentStatus];

  // Poll for status updates when generating
  useEffect(() => {
    if (currentStatus !== "generating") return;

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/campaigns/${campaign.id}`);
        if (response.ok) {
          const data = await response.json();
          if (data.status !== "generating") {
            setCurrentStatus(data.status);
            setIsGenerating(false);
            router.refresh();
          }
        }
      } catch (error) {
        console.error("Poll error:", error);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentStatus, campaign.id, router]);

  // Save campaign name
  const saveName = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) {
        throw new Error("Failed to save name");
      }

      setEditingName(false);
      router.refresh();
    } catch (error) {
      console.error("Save error:", error);
      alert("Failed to save changes. Please try again.");
    }
  };

  // Generate preview prompts
  const generatePreview = async () => {
    setIsGenerating(true);
    setCurrentStatus("generating");

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate preview");
      }

      router.refresh();
    } catch (error) {
      console.error("Generate error:", error);
      alert("Failed to generate preview. Please try again.");
      setCurrentStatus("draft");
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate full batch
  const generateFullBatch = async () => {
    // Clear existing prompts first
    await clearPrompts();

    setIsGenerating(true);
    setCurrentStatus("generating");

    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/prompts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preview: false, count: 50 }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to generate prompts");
      }

      router.refresh();
    } catch (error) {
      console.error("Generate error:", error);
      alert("Failed to generate prompts. Please try again.");
      setCurrentStatus("draft");
    } finally {
      setIsGenerating(false);
    }
  };

  // Clear prompts for regeneration
  const clearPrompts = async () => {
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}/prompts`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to clear prompts");
      }

      setCurrentStatus("draft");
      router.refresh();
    } catch (error) {
      console.error("Clear error:", error);
    }
  };

  // Filter prompts
  const filteredPrompts = selectedFilter === "all"
    ? campaign.prompts
    : campaign.prompts.filter((p) => p.variation_type === selectedFilter);

  // Get unique variation types from prompts
  const availableTypes = ["all", ...new Set(campaign.prompts.map((p) => p.variation_type).filter(Boolean) as string[])];

  const hasPreviewPrompts = campaign.prompts.some((p) => p.is_preview);
  const hasFullPrompts = campaign.prompts.some((p) => !p.is_preview);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="space-y-3">
            {/* Campaign Name (Editable) */}
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="text-2xl font-semibold text-slate-900 border border-slate-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={saveName}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditingName(false);
                    setName(campaign.name);
                  }}
                  className="px-3 py-1 border border-slate-300 text-slate-700 text-sm rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <h1
                className="text-2xl font-semibold text-slate-900 cursor-pointer hover:text-blue-600"
                onClick={() => setEditingName(true)}
              >
                {campaign.name}
              </h1>
            )}

            {/* Goal and Status Badges */}
            <div className="flex items-center gap-3">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${goal.bg} ${goal.text}`}>
                {goal.label}
              </span>
              <span className={`inline-flex items-center px-2.5 py-1 rounded text-sm font-medium ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>

            {/* Product Link */}
            {productName && productId && (
              <Link
                href={`/products/${productId}`}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Product: {productName}
              </Link>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {currentStatus === "complete" && (
              <button
                onClick={clearPrompts}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors"
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Regenerate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Generation in Progress */}
      {currentStatus === "generating" && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-8 text-center">
          <svg
            className="mx-auto h-12 w-12 text-purple-600 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-purple-900">
            Generating prompts...
          </h3>
          <p className="mt-2 text-sm text-purple-700">
            This may take a moment. The page will update automatically when complete.
          </p>
        </div>
      )}

      {/* Preview Section (Draft State) */}
      {currentStatus === "draft" && campaign.prompts.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center">
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
              d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            Ready to generate prompts
          </h3>
          <p className="mt-2 text-sm text-slate-600 max-w-md mx-auto">
            Generate a preview to see sample prompts before creating the full batch.
            This helps you verify the direction is right.
          </p>
          <button
            onClick={generatePreview}
            disabled={isGenerating}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"
              />
            </svg>
            Generate Preview
          </button>
        </div>
      )}

      {/* Preview Prompts Section */}
      {hasPreviewPrompts && !hasFullPrompts && currentStatus !== "generating" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                Preview Prompts ({campaign.prompts.length})
              </h2>
              <p className="text-sm text-slate-500">
                Review these samples. If they look good, generate the full batch.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  clearPrompts().then(() => generatePreview());
                }}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50"
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
                    d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                  />
                </svg>
                Regenerate Preview
              </button>
              <button
                onClick={generateFullBatch}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
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
                    d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5m.75-9l3-3 2.148 2.148A12.061 12.061 0 0116.5 7.605"
                  />
                </svg>
                Generate Full Batch (50+)
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {campaign.prompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>
        </div>
      )}

      {/* Full Prompts Section */}
      {hasFullPrompts && currentStatus !== "generating" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-medium text-slate-900">
                Prompts ({campaign.prompts.length})
              </h2>
              <p className="text-sm text-slate-500">
                Click on any card to expand the image generation prompt.
              </p>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {availableTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedFilter(type)}
                className={`px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors ${
                  selectedFilter === type
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {type === "all" ? "All" : type.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {/* Prompts Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPrompts.map((prompt) => (
              <PromptCard key={prompt.id} prompt={prompt} />
            ))}
          </div>

          {filteredPrompts.length === 0 && (
            <div className="text-center py-8 text-slate-500">
              No prompts match the selected filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
