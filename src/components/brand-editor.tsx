"use client";

import { useState } from "react";
import type {
  BrandColor,
  BrandFont,
  BrandTone,
} from "@/lib/supabase/database.types";

interface ColorEditorProps {
  mode: "color";
  item: Partial<BrandColor> | null;
  onSave: (data: Partial<BrandColor>) => void;
  onCancel: () => void;
}

interface FontEditorProps {
  mode: "font";
  item: Partial<BrandFont> | null;
  onSave: (data: Partial<BrandFont>) => void;
  onCancel: () => void;
}

interface ToneEditorProps {
  mode: "tone";
  item: Partial<BrandTone> | null;
  onSave: (data: Partial<BrandTone>) => void;
  onCancel: () => void;
}

type BrandEditorProps = ColorEditorProps | FontEditorProps | ToneEditorProps;

export function BrandEditor(props: BrandEditorProps) {
  const { mode, item, onSave, onCancel } = props;

  if (mode === "color") {
    return (
      <ColorEditor
        item={item as Partial<BrandColor> | null}
        onSave={onSave as (data: Partial<BrandColor>) => void}
        onCancel={onCancel}
      />
    );
  }

  if (mode === "font") {
    return (
      <FontEditor
        item={item as Partial<BrandFont> | null}
        onSave={onSave as (data: Partial<BrandFont>) => void}
        onCancel={onCancel}
      />
    );
  }

  return (
    <ToneEditor
      item={item as Partial<BrandTone> | null}
      onSave={onSave as (data: Partial<BrandTone>) => void}
      onCancel={onCancel}
    />
  );
}

function ColorEditor({
  item,
  onSave,
  onCancel,
}: {
  item: Partial<BrandColor> | null;
  onSave: (data: Partial<BrandColor>) => void;
  onCancel: () => void;
}) {
  const [hexCode, setHexCode] = useState(item?.hex_code || "#000000");
  const [name, setName] = useState(item?.name || "");
  const [usage, setUsage] = useState(item?.usage || "");
  const [isPrimary, setIsPrimary] = useState(item?.is_primary || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(item?.id && { id: item.id }),
      hex_code: hexCode,
      name: name || null,
      usage: usage || null,
      is_primary: isPrimary,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h4 className="text-sm font-medium text-slate-900 mb-3">
        {item?.id ? "Edit Color" : "Add Color"}
      </h4>

      <div className="space-y-3">
        <div className="flex gap-3">
          {/* Color picker + hex input */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Color</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={hexCode}
                onChange={(e) => setHexCode(e.target.value)}
                className="h-10 w-10 rounded cursor-pointer border border-slate-200"
              />
              <input
                type="text"
                value={hexCode}
                onChange={(e) => setHexCode(e.target.value)}
                placeholder="#000000"
                className="w-24 rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Name */}
          <div className="flex-1">
            <label className="block text-xs text-slate-600 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Brand Orange"
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Usage */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">Usage</label>
          <input
            type="text"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            placeholder="Primary buttons, CTAs"
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Primary checkbox */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-slate-700">Primary color</span>
        </label>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function FontEditor({
  item,
  onSave,
  onCancel,
}: {
  item: Partial<BrandFont> | null;
  onSave: (data: Partial<BrandFont>) => void;
  onCancel: () => void;
}) {
  const [fontFamily, setFontFamily] = useState(item?.font_family || "");
  const [fontWeight, setFontWeight] = useState(item?.font_weight || "");
  const [usage, setUsage] = useState(item?.usage || "");
  const [isPrimary, setIsPrimary] = useState(item?.is_primary || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(item?.id && { id: item.id }),
      font_family: fontFamily,
      font_weight: fontWeight || null,
      usage: usage || null,
      is_primary: isPrimary,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h4 className="text-sm font-medium text-slate-900 mb-3">
        {item?.id ? "Edit Font" : "Add Font"}
      </h4>

      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          {/* Font family */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">
              Font Family
            </label>
            <input
              type="text"
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              placeholder="Inter"
              required
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Weight */}
          <div>
            <label className="block text-xs text-slate-600 mb-1">Weight</label>
            <input
              type="text"
              value={fontWeight}
              onChange={(e) => setFontWeight(e.target.value)}
              placeholder="400, 500, 700"
              className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Usage */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">Usage</label>
          <input
            type="text"
            value={usage}
            onChange={(e) => setUsage(e.target.value)}
            placeholder="Headlines, body text"
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Primary checkbox */}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={isPrimary}
            onChange={(e) => setIsPrimary(e.target.checked)}
            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-slate-700">Primary font</span>
        </label>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}

function ToneEditor({
  item,
  onSave,
  onCancel,
}: {
  item: Partial<BrandTone> | null;
  onSave: (data: Partial<BrandTone>) => void;
  onCancel: () => void;
}) {
  const [descriptor, setDescriptor] = useState(item?.descriptor || "");
  const [example, setExample] = useState(item?.example || "");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...(item?.id && { id: item.id }),
      descriptor,
      example: example || null,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm"
    >
      <h4 className="text-sm font-medium text-slate-900 mb-3">
        {item?.id ? "Edit Tone" : "Add Tone"}
      </h4>

      <div className="space-y-3">
        {/* Descriptor */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">
            Descriptor
          </label>
          <input
            type="text"
            value={descriptor}
            onChange={(e) => setDescriptor(e.target.value)}
            placeholder="Friendly, Professional, Bold"
            required
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Example */}
        <div>
          <label className="block text-xs text-slate-600 mb-1">Example</label>
          <textarea
            value={example}
            onChange={(e) => setExample(e.target.value)}
            placeholder="Example copy that demonstrates this tone..."
            rows={3}
            className="w-full rounded border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Save
        </button>
      </div>
    </form>
  );
}
