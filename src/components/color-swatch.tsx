"use client";

import type { BrandColor } from "@/lib/supabase/database.types";

interface ColorSwatchProps {
  color: BrandColor;
  onEdit: (color: BrandColor) => void;
  onDelete: (colorId: string) => void;
}

export function ColorSwatch({ color, onEdit, onDelete }: ColorSwatchProps) {
  return (
    <div className="group relative">
      {/* Large color swatch */}
      <div
        className="h-24 w-24 rounded-lg border border-slate-200 shadow-sm"
        style={{ backgroundColor: color.hex_code }}
      />

      {/* Action buttons on hover */}
      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => onEdit(color)}
          className="p-1 rounded bg-white/90 hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
          title="Edit color"
        >
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
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(color.id)}
          className="p-1 rounded bg-white/90 hover:bg-white text-slate-600 hover:text-red-600 transition-colors"
          title="Delete color"
        >
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
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>

      {/* Primary badge */}
      {color.is_primary && (
        <div className="absolute -top-1 -left-1 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          Primary
        </div>
      )}

      {/* Color info */}
      <div className="mt-2">
        <p className="text-sm font-medium text-slate-900">
          {color.hex_code.toUpperCase()}
        </p>
        {color.name && (
          <p className="text-xs text-slate-600 truncate" title={color.name}>
            {color.name}
          </p>
        )}
        {color.usage && (
          <p className="text-xs text-slate-500 truncate" title={color.usage}>
            {color.usage}
          </p>
        )}
      </div>
    </div>
  );
}
