"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type UploadState = "idle" | "uploading" | "error";

export default function BrandUploadPage() {
  const router = useRouter();
  const [uploadState, setUploadState] = useState<UploadState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleUpload = useCallback(
    async (file: File) => {
      // Validate file type
      if (file.type !== "application/pdf") {
        setError("Please upload a PDF file.");
        return;
      }

      setUploadState("uploading");
      setError(null);

      try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await fetch("/api/brands/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || "Upload failed");
        }

        const data = await response.json();

        // Redirect to the brand profile page
        router.push(`/brands/${data.id}`);
      } catch (err) {
        setUploadState("error");
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      }
    },
    [router]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleUpload(files[0]);
      }
    },
    [handleUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleUpload(files[0]);
      }
    },
    [handleUpload]
  );

  const handleRetry = useCallback(() => {
    setUploadState("idle");
    setError(null);
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link
          href="/brands"
          className="inline-flex items-center gap-1 text-sm text-slate-600 hover:text-slate-900 mb-4"
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
              d="M15.75 19.5L8.25 12l7.5-7.5"
            />
          </svg>
          Back to Brands
        </Link>
        <h1 className="text-2xl font-semibold text-slate-900">
          Upload Brand Guidelines
        </h1>
        <p className="mt-1 text-slate-600">
          Upload a PDF with brand guidelines. We&apos;ll automatically extract
          colors, fonts, and tone of voice.
        </p>
      </div>

      {/* Upload Area */}
      <div className="flex justify-center">
        {uploadState === "uploading" ? (
          // Loading state
          <div className="w-full max-w-xl rounded-lg border-2 border-slate-200 bg-slate-50 p-12 text-center">
            <div className="flex flex-col items-center">
              <svg
                className="animate-spin h-12 w-12 text-blue-600 mb-4"
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
              <h3 className="text-lg font-medium text-slate-900">
                Extracting brand data...
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                This may take a few moments while we analyze your PDF.
              </p>
            </div>
          </div>
        ) : uploadState === "error" ? (
          // Error state
          <div className="w-full max-w-xl rounded-lg border-2 border-red-200 bg-red-50 p-12 text-center">
            <div className="flex flex-col items-center">
              <svg
                className="h-12 w-12 text-red-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                />
              </svg>
              <h3 className="text-lg font-medium text-red-900">Upload Failed</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={handleRetry}
                className="mt-4 inline-flex items-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          // Drop zone (idle state)
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`w-full max-w-xl rounded-lg border-2 border-dashed p-12 text-center transition-colors cursor-pointer ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100"
            }`}
          >
            <input
              type="file"
              accept=".pdf,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
              id="pdf-upload"
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <div className="flex flex-col items-center">
                <svg
                  className={`h-12 w-12 mb-4 ${
                    isDragging ? "text-blue-500" : "text-slate-400"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m6.75 12l-3-3m0 0l-3 3m3-3v6m-1.5-15H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-slate-900">
                  {isDragging
                    ? "Drop your PDF here"
                    : "Drop PDF here or click to browse"}
                </h3>
                <p className="mt-2 text-sm text-slate-600">
                  Upload your brand guidelines PDF to extract colors, fonts, and
                  tone
                </p>
              </div>
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
