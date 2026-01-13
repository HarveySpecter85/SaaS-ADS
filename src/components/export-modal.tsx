"use client";

import { useState, useMemo, useCallback, type ReactNode } from "react";
import JSZip from "jszip";
import type { Asset } from "@/lib/supabase/database.types";
import {
  PLATFORM_SPECS,
  PlatformKey,
  resizeImage,
  generateFilename,
  downloadBlob,
  estimateFileSize,
  formatFileSize,
} from "@/lib/export-utils";

interface ExportModalProps {
  assets: Asset[];
  onClose: () => void;
  onComplete: (message: string) => void;
}

type OutputFormat = "png" | "jpg";

interface ExportProgress {
  current: number;
  total: number;
  currentFile: string;
  failedAssets: string[];
}

// Platform card icons (simple representations)
const platformIcons: Record<PlatformKey, ReactNode> = {
  google_ads: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z" />
    </svg>
  ),
  meta: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.04c-5.5 0-10 4.49-10 10.02 0 5 3.66 9.15 8.44 9.9v-7H7.9v-2.9h2.54V9.85c0-2.51 1.49-3.89 3.78-3.89 1.09 0 2.23.19 2.23.19v2.47h-1.26c-1.24 0-1.63.77-1.63 1.56v1.88h2.78l-.45 2.9h-2.33v7a10 10 0 008.44-9.9c0-5.53-4.5-10.02-10-10.02z" />
    </svg>
  ),
  tiktok: (
    <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1.04-.1z" />
    </svg>
  ),
};

// Platform card colors
const platformColors: Record<PlatformKey, { bg: string; bgHover: string; text: string; border: string }> = {
  google_ads: {
    bg: "bg-blue-50",
    bgHover: "hover:bg-blue-100",
    text: "text-blue-700",
    border: "border-blue-300",
  },
  meta: {
    bg: "bg-indigo-50",
    bgHover: "hover:bg-indigo-100",
    text: "text-indigo-700",
    border: "border-indigo-300",
  },
  tiktok: {
    bg: "bg-rose-50",
    bgHover: "hover:bg-rose-100",
    text: "text-rose-700",
    border: "border-rose-300",
  },
};

export function ExportModal({ assets, onClose, onComplete }: ExportModalProps) {
  // Selected platforms and formats
  const [selectedPlatforms, setSelectedPlatforms] = useState<Set<PlatformKey>>(new Set());
  const [selectedFormats, setSelectedFormats] = useState<Map<PlatformKey, Set<string>>>(new Map());

  // Export options
  const [outputFormat, setOutputFormat] = useState<OutputFormat>("png");
  const [jpegQuality, setJpegQuality] = useState(80);

  // Export state
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState<ExportProgress | null>(null);
  const [isCancelled, setIsCancelled] = useState(false);

  // Initialize selected formats when a platform is selected
  const togglePlatform = useCallback((platform: PlatformKey) => {
    setSelectedPlatforms((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(platform)) {
        newSet.delete(platform);
        // Also remove from selected formats
        setSelectedFormats((prevFormats) => {
          const newMap = new Map(prevFormats);
          newMap.delete(platform);
          return newMap;
        });
      } else {
        newSet.add(platform);
        // Initialize all formats as selected
        setSelectedFormats((prevFormats) => {
          const newMap = new Map(prevFormats);
          const allFormats = PLATFORM_SPECS[platform].formats.map((f) => f.name);
          newMap.set(platform, new Set(allFormats));
          return newMap;
        });
      }
      return newSet;
    });
  }, []);

  // Toggle a specific format for a platform
  const toggleFormat = useCallback((platform: PlatformKey, formatName: string) => {
    setSelectedFormats((prev) => {
      const newMap = new Map(prev);
      const platformFormats = newMap.get(platform) || new Set();
      const newFormats = new Set(platformFormats);

      if (newFormats.has(formatName)) {
        newFormats.delete(formatName);
      } else {
        newFormats.add(formatName);
      }

      newMap.set(platform, newFormats);
      return newMap;
    });
  }, []);

  // Calculate total files and estimated size
  const exportSummary = useMemo(() => {
    let totalFormats = 0;

    selectedPlatforms.forEach((platform) => {
      const formats = selectedFormats.get(platform);
      if (formats) {
        totalFormats += formats.size;
      }
    });

    const totalFiles = assets.length * totalFormats;

    // Estimate total size
    let estimatedBytes = 0;
    selectedPlatforms.forEach((platform) => {
      const formats = selectedFormats.get(platform);
      if (formats) {
        PLATFORM_SPECS[platform].formats.forEach((format) => {
          if (formats.has(format.name)) {
            estimatedBytes +=
              assets.length *
              estimateFileSize(
                format.width,
                format.height,
                outputFormat === "png" ? "png" : "jpeg",
                jpegQuality / 100
              );
          }
        });
      }
    });

    return {
      assetCount: assets.length,
      formatCount: totalFormats,
      totalFiles,
      estimatedSize: formatFileSize(estimatedBytes),
    };
  }, [assets.length, selectedPlatforms, selectedFormats, outputFormat, jpegQuality]);

  // Handle export
  const handleExport = async () => {
    if (selectedPlatforms.size === 0) return;

    setIsExporting(true);
    setIsCancelled(false);
    setProgress({
      current: 0,
      total: exportSummary.totalFiles,
      currentFile: "",
      failedAssets: [],
    });

    const failedAssets: string[] = [];
    let processedCount = 0;

    // Create a ZIP for each platform
    for (const platform of selectedPlatforms) {
      if (isCancelled) break;

      const formats = selectedFormats.get(platform);
      if (!formats || formats.size === 0) continue;

      const zip = new JSZip();
      const platformSpec = PLATFORM_SPECS[platform];
      const platformFormats = platformSpec.formats.filter((f) => formats.has(f.name));

      // Process each asset
      for (const asset of assets) {
        if (isCancelled) break;

        // Process each format for this asset
        for (const format of platformFormats) {
          if (isCancelled) break;

          const filename = generateFilename(
            asset.id,
            platform,
            format.name,
            outputFormat === "png" ? "png" : "jpg"
          );

          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  current: processedCount,
                  currentFile: filename,
                }
              : null
          );

          try {
            // Resize the image
            const resizedBlob = await resizeImage(
              asset.image_url,
              format.width,
              format.height,
              outputFormat === "png" ? "png" : "jpeg",
              jpegQuality / 100
            );

            // Add to ZIP
            zip.file(filename, resizedBlob);
          } catch (error) {
            console.error(`Failed to process ${asset.id} for ${format.name}:`, error);
            failedAssets.push(`${asset.id.slice(0, 8)} (${format.name})`);
          }

          processedCount++;
          setProgress((prev) =>
            prev
              ? {
                  ...prev,
                  current: processedCount,
                  failedAssets,
                }
              : null
          );
        }
      }

      if (isCancelled) break;

      // Generate and download the ZIP
      try {
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const zipFilename = `${platform}_export_${new Date().toISOString().slice(0, 10)}.zip`;
        downloadBlob(zipBlob, zipFilename);
      } catch (error) {
        console.error(`Failed to generate ZIP for ${platform}:`, error);
      }
    }

    setIsExporting(false);

    if (!isCancelled) {
      const successCount = exportSummary.totalFiles - failedAssets.length;
      const platformNames = Array.from(selectedPlatforms)
        .map((p) => PLATFORM_SPECS[p].name)
        .join(", ");

      if (failedAssets.length > 0) {
        onComplete(
          `Exported ${successCount} files to ${platformNames}. ${failedAssets.length} files failed.`
        );
      } else {
        onComplete(`Exported ${successCount} files to ${platformNames}`);
      }
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (isExporting) {
      setIsCancelled(true);
    } else {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            Export {assets.length} {assets.length === 1 ? "Asset" : "Assets"}
          </h2>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Platform Selection */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Select Platforms</h3>
            <div className="grid grid-cols-3 gap-3">
              {(Object.keys(PLATFORM_SPECS) as PlatformKey[]).map((platform) => {
                const isSelected = selectedPlatforms.has(platform);
                const colors = platformColors[platform];

                return (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    disabled={isExporting}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      isSelected
                        ? `${colors.bg} ${colors.border} ${colors.text}`
                        : `bg-white border-slate-200 text-slate-500 ${colors.bgHover}`
                    } ${isExporting ? "opacity-50 cursor-not-allowed" : ""}`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      {platformIcons[platform]}
                      <span className="text-sm font-medium">
                        {PLATFORM_SPECS[platform].name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Format Options per Platform */}
          {selectedPlatforms.size > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 mb-3">Output Formats</h3>
              <div className="space-y-4">
                {Array.from(selectedPlatforms).map((platform) => {
                  const platformFormats = selectedFormats.get(platform) || new Set();
                  const spec = PLATFORM_SPECS[platform];

                  return (
                    <div
                      key={platform}
                      className="bg-slate-50 rounded-lg p-4"
                    >
                      <h4 className="text-sm font-medium text-slate-800 mb-2">
                        {spec.name}
                      </h4>
                      <div className="space-y-2">
                        {spec.formats.map((format) => (
                          <label
                            key={format.name}
                            className="flex items-center gap-3 cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              checked={platformFormats.has(format.name)}
                              onChange={() => toggleFormat(platform, format.name)}
                              disabled={isExporting}
                              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-slate-700">
                              {format.name}
                            </span>
                            <span className="text-xs text-slate-400">
                              {format.width} x {format.height}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">Export Options</h3>
            <div className="bg-slate-50 rounded-lg p-4 space-y-4">
              {/* Output Format */}
              <div>
                <label className="text-sm text-slate-600 mb-2 block">Output Format</label>
                <div className="flex gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="outputFormat"
                      value="png"
                      checked={outputFormat === "png"}
                      onChange={() => setOutputFormat("png")}
                      disabled={isExporting}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">PNG</span>
                    <span className="text-xs text-slate-400">(recommended)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="outputFormat"
                      value="jpg"
                      checked={outputFormat === "jpg"}
                      onChange={() => setOutputFormat("jpg")}
                      disabled={isExporting}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-slate-700">JPG</span>
                    <span className="text-xs text-slate-400">(smaller file size)</span>
                  </label>
                </div>
              </div>

              {/* JPEG Quality Slider */}
              {outputFormat === "jpg" && (
                <div>
                  <label className="text-sm text-slate-600 mb-2 block">
                    Quality: {jpegQuality}%
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    value={jpegQuality}
                    onChange={(e) => setJpegQuality(Number(e.target.value))}
                    disabled={isExporting}
                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Preview Summary */}
          {selectedPlatforms.size > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 text-blue-800">
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm font-medium">Export Summary</span>
              </div>
              <p className="text-sm text-blue-700 mt-2">
                {exportSummary.assetCount} {exportSummary.assetCount === 1 ? "asset" : "assets"} x{" "}
                {exportSummary.formatCount} {exportSummary.formatCount === 1 ? "format" : "formats"} ={" "}
                <strong>{exportSummary.totalFiles} total files</strong>
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Estimated size: ~{exportSummary.estimatedSize}
              </p>
            </div>
          )}

          {/* Progress Indicator */}
          {isExporting && progress && (
            <div className="bg-slate-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-slate-700">
                  Exporting...
                </span>
                <span className="text-sm text-slate-500">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
              {progress.currentFile && (
                <p className="text-xs text-slate-500 mt-2 truncate">
                  Processing: {progress.currentFile}
                </p>
              )}
              {progress.failedAssets.length > 0 && (
                <p className="text-xs text-amber-600 mt-1">
                  {progress.failedAssets.length} file(s) failed
                </p>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 p-5 border-t border-slate-200 bg-slate-50">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
          >
            {isExporting ? "Cancel" : "Close"}
          </button>
          <button
            onClick={handleExport}
            disabled={selectedPlatforms.size === 0 || exportSummary.totalFiles === 0 || isExporting}
            className={`px-6 py-2 text-sm font-medium rounded-lg transition-colors ${
              selectedPlatforms.size > 0 && exportSummary.totalFiles > 0 && !isExporting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-slate-300 text-slate-500 cursor-not-allowed"
            }`}
          >
            {isExporting ? "Exporting..." : "Export"}
          </button>
        </div>
      </div>
    </div>
  );
}
