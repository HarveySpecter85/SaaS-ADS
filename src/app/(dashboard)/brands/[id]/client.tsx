"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  BrandWithRelations,
  BrandColor,
  BrandFont,
  BrandTone,
} from "@/lib/supabase/database.types";
import { ColorSwatch } from "@/components/color-swatch";
import { BrandEditor } from "@/components/brand-editor";

interface BrandProfileClientProps {
  brand: BrandWithRelations;
}

type EditMode =
  | { type: "color"; item: Partial<BrandColor> | null }
  | { type: "font"; item: Partial<BrandFont> | null }
  | { type: "tone"; item: Partial<BrandTone> | null }
  | null;

export function BrandProfileClient({ brand }: BrandProfileClientProps) {
  const router = useRouter();
  const [editMode, setEditMode] = useState<EditMode>(null);
  const [saving, setSaving] = useState(false);

  const saveChanges = async (
    updates: Partial<{
      colors: Partial<BrandColor>[];
      fonts: Partial<BrandFont>[];
      tone: Partial<BrandTone>[];
    }>
  ) => {
    setSaving(true);
    try {
      const response = await fetch(`/api/brands/${brand.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      router.refresh();
      setEditMode(null);
    } catch (error) {
      console.error("Error saving:", error);
      alert("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Color handlers
  const handleSaveColor = (colorData: Partial<BrandColor>) => {
    const existingColors = brand.colors.map((c) => ({
      hex_code: c.hex_code,
      name: c.name,
      usage: c.usage,
      is_primary: c.is_primary,
      id: c.id,
    }));

    let updatedColors: Partial<BrandColor>[];

    if (colorData.id) {
      // Update existing
      updatedColors = existingColors.map((c) =>
        c.id === colorData.id ? { ...c, ...colorData } : c
      );
    } else {
      // Add new
      updatedColors = [...existingColors, colorData];
    }

    // Remove ids for the API (replace-all strategy)
    const colorsForApi = updatedColors.map(
      ({ hex_code, name, usage, is_primary }) => ({
        hex_code,
        name,
        usage,
        is_primary,
      })
    );

    saveChanges({ colors: colorsForApi });
  };

  const handleDeleteColor = (colorId: string) => {
    if (!confirm("Delete this color?")) return;

    const updatedColors = brand.colors
      .filter((c) => c.id !== colorId)
      .map(({ hex_code, name, usage, is_primary }) => ({
        hex_code,
        name,
        usage,
        is_primary,
      }));

    saveChanges({ colors: updatedColors });
  };

  // Font handlers
  const handleSaveFont = (fontData: Partial<BrandFont>) => {
    const existingFonts = brand.fonts.map((f) => ({
      font_family: f.font_family,
      font_weight: f.font_weight,
      usage: f.usage,
      is_primary: f.is_primary,
      id: f.id,
    }));

    let updatedFonts: Partial<BrandFont>[];

    if (fontData.id) {
      updatedFonts = existingFonts.map((f) =>
        f.id === fontData.id ? { ...f, ...fontData } : f
      );
    } else {
      updatedFonts = [...existingFonts, fontData];
    }

    const fontsForApi = updatedFonts.map(
      ({ font_family, font_weight, usage, is_primary }) => ({
        font_family,
        font_weight,
        usage,
        is_primary,
      })
    );

    saveChanges({ fonts: fontsForApi });
  };

  const handleDeleteFont = (fontId: string) => {
    if (!confirm("Delete this font?")) return;

    const updatedFonts = brand.fonts
      .filter((f) => f.id !== fontId)
      .map(({ font_family, font_weight, usage, is_primary }) => ({
        font_family,
        font_weight,
        usage,
        is_primary,
      }));

    saveChanges({ fonts: updatedFonts });
  };

  // Tone handlers
  const handleSaveTone = (toneData: Partial<BrandTone>) => {
    const existingTone = brand.tone.map((t) => ({
      descriptor: t.descriptor,
      example: t.example,
      id: t.id,
    }));

    let updatedTone: Partial<BrandTone>[];

    if (toneData.id) {
      updatedTone = existingTone.map((t) =>
        t.id === toneData.id ? { ...t, ...toneData } : t
      );
    } else {
      updatedTone = [...existingTone, toneData];
    }

    const toneForApi = updatedTone.map(({ descriptor, example }) => ({
      descriptor,
      example,
    }));

    saveChanges({ tone: toneForApi });
  };

  const handleDeleteTone = (toneId: string) => {
    if (!confirm("Delete this tone descriptor?")) return;

    const updatedTone = brand.tone
      .filter((t) => t.id !== toneId)
      .map(({ descriptor, example }) => ({
        descriptor,
        example,
      }));

    saveChanges({ tone: updatedTone });
  };

  return (
    <div className="space-y-8">
      {/* Saving overlay */}
      {saving && (
        <div className="fixed inset-0 bg-white/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-lg px-6 py-4 flex items-center gap-3">
            <svg
              className="animate-spin h-5 w-5 text-blue-600"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            <span className="text-slate-700">Saving...</span>
          </div>
        </div>
      )}

      {/* Colors Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Colors</h2>
          <button
            onClick={() => setEditMode({ type: "color", item: null })}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
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
            Add Color
          </button>
        </div>

        {editMode?.type === "color" && (
          <div className="mb-4">
            <BrandEditor
              mode="color"
              item={editMode.item}
              onSave={handleSaveColor}
              onCancel={() => setEditMode(null)}
            />
          </div>
        )}

        {brand.colors.length > 0 ? (
          <div className="flex flex-wrap gap-4">
            {brand.colors.map((color) => (
              <ColorSwatch
                key={color.id}
                color={color}
                onEdit={(c) => setEditMode({ type: "color", item: c })}
                onDelete={handleDeleteColor}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            No colors defined yet. Click &quot;Add Color&quot; to get started.
          </div>
        )}
      </section>

      {/* Fonts Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Fonts</h2>
          <button
            onClick={() => setEditMode({ type: "font", item: null })}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
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
            Add Font
          </button>
        </div>

        {editMode?.type === "font" && (
          <div className="mb-4">
            <BrandEditor
              mode="font"
              item={editMode.item}
              onSave={handleSaveFont}
              onCancel={() => setEditMode(null)}
            />
          </div>
        )}

        {brand.fonts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {brand.fonts.map((font) => (
              <FontCard
                key={font.id}
                font={font}
                onEdit={(f) => setEditMode({ type: "font", item: f })}
                onDelete={handleDeleteFont}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            No fonts defined yet. Click &quot;Add Font&quot; to get started.
          </div>
        )}
      </section>

      {/* Tone Section */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-slate-900">Tone of Voice</h2>
          <button
            onClick={() => setEditMode({ type: "tone", item: null })}
            className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
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
            Add
          </button>
        </div>

        {editMode?.type === "tone" && (
          <div className="mb-4">
            <BrandEditor
              mode="tone"
              item={editMode.item}
              onSave={handleSaveTone}
              onCancel={() => setEditMode(null)}
            />
          </div>
        )}

        {brand.tone.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {brand.tone.map((t) => (
              <ToneCard
                key={t.id}
                tone={t}
                onEdit={(tone) => setEditMode({ type: "tone", item: tone })}
                onDelete={handleDeleteTone}
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-slate-500">
            No tone descriptors defined yet. Click &quot;Add&quot; to get
            started.
          </div>
        )}
      </section>
    </div>
  );
}

// Font card component
function FontCard({
  font,
  onEdit,
  onDelete,
}: {
  font: BrandFont;
  onEdit: (font: BrandFont) => void;
  onDelete: (fontId: string) => void;
}) {
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => onEdit(font)}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          title="Edit font"
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
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(font.id)}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600"
          title="Delete font"
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

      {/* Primary badge */}
      {font.is_primary && (
        <div className="absolute -top-2 -left-2 bg-blue-600 text-white text-[10px] px-1.5 py-0.5 rounded font-medium">
          Primary
        </div>
      )}

      {/* Font name */}
      <h3 className="text-lg font-medium text-slate-900">{font.font_family}</h3>

      {/* Preview text */}
      <p
        className="mt-2 text-slate-600"
        style={{ fontFamily: `${font.font_family}, system-ui, sans-serif` }}
      >
        The quick brown fox jumps over the lazy dog
      </p>

      {/* Metadata */}
      <div className="mt-3 flex gap-4 text-xs text-slate-500">
        {font.font_weight && <span>Weight: {font.font_weight}</span>}
        {font.usage && <span>{font.usage}</span>}
      </div>
    </div>
  );
}

// Tone card component
function ToneCard({
  tone,
  onEdit,
  onDelete,
}: {
  tone: BrandTone;
  onEdit: (tone: BrandTone) => void;
  onDelete: (toneId: string) => void;
}) {
  return (
    <div className="group relative rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
      {/* Action buttons */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={() => onEdit(tone)}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          title="Edit tone"
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
              d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125"
            />
          </svg>
        </button>
        <button
          onClick={() => onDelete(tone.id)}
          className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-red-600"
          title="Delete tone"
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

      {/* Descriptor */}
      <h3 className="text-base font-medium text-slate-900">{tone.descriptor}</h3>

      {/* Example */}
      {tone.example && (
        <p className="mt-2 text-sm text-slate-600 italic">
          &quot;{tone.example}&quot;
        </p>
      )}
    </div>
  );
}
