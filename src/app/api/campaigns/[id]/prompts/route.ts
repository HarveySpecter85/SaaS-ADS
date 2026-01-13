import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { gemini } from "@/lib/gemini";
import type { CampaignGoal, Prompt } from "@/lib/supabase/database.types";

// Validate UUID format
function isValidUUID(id: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
}

// Generated prompt structure from Gemini
interface GeneratedPrompt {
  prompt_text: string;
  headline: string;
  description: string;
  cta: string;
  variation_type: string;
}

// Build the Gemini prompt based on campaign goal
function buildGeminiPrompt(
  brandData: {
    name: string;
    colors: Array<{ hex_code: string; name: string | null }>;
    fonts: Array<{ font_family: string }>;
    tone: Array<{ descriptor: string }>;
  },
  productData: {
    name: string;
    description: string | null;
    hero_image_url: string | null;
  },
  goal: CampaignGoal,
  count: number
): string {
  const goalInstructions = {
    awareness: `
Focus on brand storytelling and emotional connection.
- Headlines should evoke curiosity and brand values
- Descriptions should tell a story about the brand/product
- CTAs should invite exploration (e.g., "Discover More", "Learn Our Story")
- Variation types: brand_story, lifestyle_context, emotional_appeal, aspirational`,
    lead_gen: `
Focus on value proposition and curiosity hooks.
- Headlines should highlight unique benefits
- Descriptions should create intrigue and promise value
- CTAs should offer value exchange (e.g., "Get Your Free Guide", "See How It Works")
- Variation types: benefit_driven, problem_solution, social_proof, curiosity_hook`,
    conversion: `
Focus on urgency, specific benefits, and clear action.
- Headlines should be direct and benefit-focused
- Descriptions should overcome objections and highlight value
- CTAs should drive immediate action (e.g., "Buy Now", "Get Started Today")
- Variation types: urgency_driven, benefit_stack, testimonial_style, limited_offer`,
  };

  const colorsText = brandData.colors
    .map((c) => `${c.hex_code}${c.name ? ` (${c.name})` : ""}`)
    .join(", ");
  const fontsText = brandData.fonts.map((f) => f.font_family).join(", ");
  const toneText = brandData.tone.map((t) => t.descriptor).join(", ");

  return `Generate ${count} unique ad creative prompts for image generation.

BRAND CONTEXT:
- Brand: ${brandData.name}
- Colors: ${colorsText || "Not specified"}
- Fonts: ${fontsText || "Not specified"}
- Tone of voice: ${toneText || "Professional"}

PRODUCT:
- Name: ${productData.name}
- Description: ${productData.description || "Not specified"}
${productData.hero_image_url ? `- Hero image reference: ${productData.hero_image_url}` : ""}

CAMPAIGN GOAL: ${goal.toUpperCase().replace("_", " ")}
${goalInstructions[goal]}

INSTRUCTIONS:
1. Generate ${count} unique prompt variations
2. Each prompt_text should be a detailed image generation prompt for Imagen 3
3. Include visual style, scene description, lighting, mood that aligns with brand
4. Ensure brand colors and tone are reflected in the visual description
5. Keep the product as the hero/focus of each image
6. Make each variation genuinely different (different scenes, angles, contexts)

Return ONLY valid JSON array with this structure:
[
  {
    "prompt_text": "Detailed Imagen 3 prompt describing the visual scene with product...",
    "headline": "Ad headline text (max 30 chars)",
    "description": "Ad description (max 90 chars)",
    "cta": "Call to action text",
    "variation_type": "category of this variation"
  }
]

Generate exactly ${count} variations. Return ONLY the JSON array, no markdown or explanation.`;
}

// POST: Generate prompts for campaign
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const body = await request.json();

    // Parse options
    const preview = body.preview !== false; // Default to preview mode
    const count = preview ? 3 : (body.count || 50);

    // Fetch campaign
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Fetch product with brand data
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("*, brand:brands(*)")
      .eq("id", campaign.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: "Product not found for campaign" },
        { status: 400 }
      );
    }

    // Fetch brand relations (colors, fonts, tone)
    const brand = product.brand;
    if (!brand) {
      return NextResponse.json(
        { error: "Brand not found for product" },
        { status: 400 }
      );
    }

    const [colorsResult, fontsResult, toneResult, heroImageResult] = await Promise.all([
      supabase.from("brand_colors").select("*").eq("brand_id", brand.id),
      supabase.from("brand_fonts").select("*").eq("brand_id", brand.id),
      supabase.from("brand_tone").select("*").eq("brand_id", brand.id),
      supabase
        .from("product_images")
        .select("*")
        .eq("product_id", product.id)
        .eq("is_hero", true)
        .limit(1)
        .single(),
    ]);

    const brandData = {
      name: brand.name,
      colors: colorsResult.data || [],
      fonts: fontsResult.data || [],
      tone: toneResult.data || [],
    };

    const productData = {
      name: product.name,
      description: product.description,
      hero_image_url: heroImageResult.data?.image_url || null,
    };

    // Update campaign status to generating
    await supabase
      .from("campaigns")
      .update({ status: "generating", updated_at: new Date().toISOString() })
      .eq("id", id);

    // Generate prompts with Gemini
    const geminiPrompt = buildGeminiPrompt(
      brandData,
      productData,
      campaign.goal as CampaignGoal,
      count
    );

    let generatedPrompts: GeneratedPrompt[];

    try {
      const result = await gemini.generateContent(geminiPrompt);
      const text = result.response.text();

      // Parse JSON from response (handle potential markdown wrapping)
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error("Failed to extract JSON array from Gemini response");
      }

      generatedPrompts = JSON.parse(jsonMatch[0]) as GeneratedPrompt[];
    } catch (geminiError) {
      // Reset status on failure
      await supabase
        .from("campaigns")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", id);

      console.error("Gemini generation error:", geminiError);
      return NextResponse.json(
        { error: "Failed to generate prompts", details: String(geminiError) },
        { status: 500 }
      );
    }

    // Insert prompts into database
    const promptsToInsert = generatedPrompts.map((p) => ({
      campaign_id: id,
      prompt_text: p.prompt_text,
      headline: p.headline || null,
      description: p.description || null,
      cta: p.cta || null,
      variation_type: p.variation_type || null,
      is_preview: preview,
    }));

    const { data: insertedPrompts, error: insertError } = await supabase
      .from("prompts")
      .insert(promptsToInsert)
      .select();

    if (insertError) {
      // Reset status on failure
      await supabase
        .from("campaigns")
        .update({ status: "draft", updated_at: new Date().toISOString() })
        .eq("id", id);

      return NextResponse.json(
        { error: "Failed to save prompts", details: insertError.message },
        { status: 500 }
      );
    }

    // Update campaign status to complete
    await supabase
      .from("campaigns")
      .update({ status: "complete", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({
      campaign_id: id,
      preview,
      count: insertedPrompts?.length || 0,
      prompts: insertedPrompts as Prompt[],
    });
  } catch (error) {
    console.error("POST /api/campaigns/[id]/prompts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE: Clear all prompts for campaign (for regeneration)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!isValidUUID(id)) {
      return NextResponse.json(
        { error: "Invalid campaign ID format" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if campaign exists
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("id")
      .eq("id", id)
      .single();

    if (campaignError || !campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Delete all prompts for this campaign
    const { error: deleteError } = await supabase
      .from("prompts")
      .delete()
      .eq("campaign_id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "Failed to delete prompts", details: deleteError.message },
        { status: 500 }
      );
    }

    // Reset campaign status to draft
    await supabase
      .from("campaigns")
      .update({ status: "draft", updated_at: new Date().toISOString() })
      .eq("id", id);

    return NextResponse.json({
      success: true,
      campaign_id: id,
      message: "All prompts cleared, campaign reset to draft",
    });
  } catch (error) {
    console.error("DELETE /api/campaigns/[id]/prompts error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
