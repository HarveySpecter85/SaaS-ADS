"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { ProductWithImages, CampaignGoal } from "@/lib/supabase/database.types";

interface ProductOption {
  id: string;
  name: string;
  hero_image_url: string | null;
}

// Goal options with descriptions
const goalOptions: Array<{
  value: CampaignGoal;
  label: string;
  description: string;
  color: { bg: string; border: string; text: string; icon: string };
}> = [
  {
    value: "awareness",
    label: "Awareness",
    description: "Build brand recognition and emotional connection",
    color: {
      bg: "bg-blue-50",
      border: "border-blue-300",
      text: "text-blue-700",
      icon: "text-blue-500",
    },
  },
  {
    value: "lead_gen",
    label: "Lead Gen",
    description: "Capture interest and generate qualified leads",
    color: {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-700",
      icon: "text-green-500",
    },
  },
  {
    value: "conversion",
    label: "Conversion",
    description: "Drive immediate action and sales",
    color: {
      bg: "bg-orange-50",
      border: "border-orange-300",
      text: "text-orange-700",
      icon: "text-orange-500",
    },
  },
];

export default function NewCampaignPage() {
  const router = useRouter();
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<CampaignGoal | null>(null);
  const [campaignName, setCampaignName] = useState("");

  // Fetch products on mount
  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        if (!response.ok) throw new Error("Failed to fetch products");

        const data = await response.json();

        // Extract hero image for each product
        const productOptions: ProductOption[] = data.map((product: ProductWithImages) => {
          const heroImage = product.images?.find((img) => img.is_hero) || product.images?.[0];
          return {
            id: product.id,
            name: product.name,
            hero_image_url: heroImage?.image_url || null,
          };
        });

        setProducts(productOptions);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  // Auto-generate campaign name when product and goal are selected
  useEffect(() => {
    if (selectedProduct && selectedGoal) {
      const product = products.find((p) => p.id === selectedProduct);
      const goal = goalOptions.find((g) => g.value === selectedGoal);
      if (product && goal) {
        setCampaignName(`${product.name} - ${goal.label} Campaign`);
      }
    }
  }, [selectedProduct, selectedGoal, products]);

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProduct || !selectedGoal) {
      alert("Please select a product and goal.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: selectedProduct,
          goal: selectedGoal,
          name: campaignName || `${products.find((p) => p.id === selectedProduct)?.name} Campaign`,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create campaign");
      }

      const campaign = await response.json();
      router.push(`/campaigns/${campaign.id}`);
    } catch (error) {
      console.error("Create error:", error);
      alert("Failed to create campaign. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <Link
          href="/campaigns"
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
          Back to Campaigns
        </Link>

        <h1 className="text-2xl font-semibold text-slate-900">New Campaign</h1>
        <p className="mt-1 text-sm text-slate-600">
          Create a campaign to generate ad creatives for your product.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Product */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              1
            </span>
            <h2 className="text-lg font-medium text-slate-900">Select Product</h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500">
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <p className="text-sm text-slate-600">
                No products available. Create a product first.
              </p>
              <Link
                href="/products/new"
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
              >
                Create Product
              </Link>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProduct(product.id)}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 text-left transition-all ${
                    selectedProduct === product.id
                      ? "border-blue-600 bg-blue-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  {/* Hero Image Thumbnail */}
                  <div className="w-16 h-16 rounded-md bg-slate-100 overflow-hidden flex-shrink-0">
                    {product.hero_image_url ? (
                      <img
                        src={product.hero_image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-slate-300"
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
                      </div>
                    )}
                  </div>

                  {/* Product Name */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {product.name}
                    </p>
                    {selectedProduct === product.id && (
                      <p className="text-sm text-blue-600">Selected</p>
                    )}
                  </div>

                  {/* Check Icon */}
                  {selectedProduct === product.id && (
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Step 2: Select Goal */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              2
            </span>
            <h2 className="text-lg font-medium text-slate-900">Select Goal</h2>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {goalOptions.map((goal) => (
              <button
                key={goal.value}
                type="button"
                onClick={() => setSelectedGoal(goal.value)}
                className={`p-5 rounded-lg border-2 text-left transition-all ${
                  selectedGoal === goal.value
                    ? `${goal.color.border} ${goal.color.bg}`
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {/* Icon */}
                <div className={`mb-3 ${selectedGoal === goal.value ? goal.color.icon : "text-slate-400"}`}>
                  {goal.value === "awareness" && (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  )}
                  {goal.value === "lead_gen" && (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
                      />
                    </svg>
                  )}
                  {goal.value === "conversion" && (
                    <svg
                      className="w-8 h-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
                      />
                    </svg>
                  )}
                </div>

                {/* Label */}
                <h3 className={`font-medium ${selectedGoal === goal.value ? goal.color.text : "text-slate-900"}`}>
                  {goal.label}
                </h3>

                {/* Description */}
                <p className="mt-1 text-sm text-slate-600">
                  {goal.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Campaign Name (Optional) */}
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700 text-sm font-medium">
              3
            </span>
            <h2 className="text-lg font-medium text-slate-900">
              Name Campaign <span className="text-slate-400 font-normal">(optional)</span>
            </h2>
          </div>

          <input
            type="text"
            value={campaignName}
            onChange={(e) => setCampaignName(e.target.value)}
            placeholder="e.g., Summer Collection - Awareness Campaign"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <p className="text-sm text-slate-500">
            Leave blank to auto-generate based on product and goal.
          </p>
        </div>

        {/* Submit Button */}
        <div className="pt-4 border-t border-slate-200">
          <button
            type="submit"
            disabled={!selectedProduct || !selectedGoal || submitting}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin h-5 w-5"
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
                Creating...
              </>
            ) : (
              <>
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
                    d="M12 4.5v15m7.5-7.5h-15"
                  />
                </svg>
                Create Campaign
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
