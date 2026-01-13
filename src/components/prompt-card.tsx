"use client";

import { useState } from "react";
import type { Prompt } from "@/lib/supabase/database.types";

interface PromptCardProps {
  prompt: Prompt;
  onCopy?: (text: string) => void;
}

export function PromptCard({ prompt, onCopy }: PromptCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt.prompt_text);
      setCopied(true);
      onCopy?.(prompt.prompt_text);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {/* Header: Variation Type + Preview Badge */}
      <div className="flex items-center justify-between mb-3">
        {prompt.variation_type && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {prompt.variation_type.replace(/_/g, " ")}
          </span>
        )}
        {prompt.is_preview && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
            Preview
          </span>
        )}
      </div>

      {/* Headline (Large, Bold) */}
      {prompt.headline && (
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          {prompt.headline}
        </h3>
      )}

      {/* Description */}
      {prompt.description && (
        <p className="text-sm text-slate-600 mb-4">
          {prompt.description}
        </p>
      )}

      {/* CTA Button Preview */}
      {prompt.cta && (
        <div className="mb-4">
          <span className="inline-block px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md">
            {prompt.cta}
          </span>
        </div>
      )}

      {/* Expand/Collapse Prompt Text */}
      <div className="border-t border-slate-100 pt-3 mt-3">
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19.5 8.25l-7.5 7.5-7.5-7.5"
            />
          </svg>
          {isExpanded ? "Hide" : "Show"} image prompt
        </button>

        {isExpanded && (
          <div className="mt-3 space-y-2">
            <div className="p-3 bg-slate-50 rounded-md text-sm text-slate-700 font-mono whitespace-pre-wrap">
              {prompt.prompt_text}
            </div>
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 rounded hover:bg-slate-200 transition-colors"
            >
              {copied ? (
                <>
                  <svg
                    className="w-3.5 h-3.5 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                  Copied!
                </>
              ) : (
                <>
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184"
                    />
                  </svg>
                  Copy prompt
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
