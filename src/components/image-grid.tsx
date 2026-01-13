"use client";

import { useRef, useState } from "react";
import type { ProductImage } from "@/lib/supabase/database.types";

interface ImageGridProps {
  images: ProductImage[];
  productId: string;
  onUpload: (file: File) => Promise<void>;
  onDelete: (imageId: string) => Promise<void>;
  onSetHero: (imageId: string) => Promise<void>;
}

export function ImageGrid({
  images,
  productId,
  onUpload,
  onDelete,
  onSetHero,
}: ImageGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && files[0].type.startsWith("image/")) {
      setUploading(true);
      try {
        await onUpload(files[0]);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setUploading(true);
      try {
        await onUpload(files[0]);
      } finally {
        setUploading(false);
        // Reset input so same file can be selected again
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    }
  };

  const handleDeleteClick = async (imageId: string) => {
    if (!confirm("Delete this image?")) return;
    await onDelete(imageId);
  };

  // Sort images: hero first, then by sort_order
  const sortedImages = [...images].sort((a, b) => {
    if (a.is_hero && !b.is_hero) return -1;
    if (!a.is_hero && b.is_hero) return 1;
    return a.sort_order - b.sort_order;
  });

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Existing Images */}
      {sortedImages.map((image) => (
        <div
          key={image.id}
          className="group relative rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden"
        >
          {/* Image */}
          <div className="h-48 w-full bg-slate-100">
            <img
              src={image.image_url}
              alt={image.angle || "Product image"}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Hero Badge */}
          {image.is_hero && (
            <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-1 rounded font-medium">
              HERO
            </div>
          )}

          {/* Angle Label */}
          {image.angle && (
            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {image.angle}
            </div>
          )}

          {/* Action Buttons (visible on hover) */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
            {!image.is_hero && (
              <button
                onClick={() => onSetHero(image.id)}
                className="p-1.5 rounded bg-white/90 hover:bg-white text-slate-600 hover:text-blue-600 shadow-sm"
                title="Set as Hero"
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
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </button>
            )}
            <button
              onClick={() => handleDeleteClick(image.id)}
              className="p-1.5 rounded bg-white/90 hover:bg-white text-slate-600 hover:text-red-600 shadow-sm"
              title="Delete"
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
                  d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
                />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`h-48 rounded-lg border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors ${
          isDragging
            ? "border-blue-500 bg-blue-50"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center">
            <svg
              className="animate-spin h-8 w-8 text-blue-600 mb-2"
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
            <span className="text-sm text-slate-600">Uploading...</span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <svg
              className={`w-8 h-8 mb-2 ${
                isDragging ? "text-blue-500" : "text-slate-400"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4.5v15m7.5-7.5h-15"
              />
            </svg>
            <span
              className={`text-sm ${
                isDragging ? "text-blue-600" : "text-slate-500"
              }`}
            >
              {isDragging ? "Drop image here" : "Add image"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
