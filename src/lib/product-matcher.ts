import { createClient } from '@/lib/supabase/server';

// Product with image for display
export interface ProductRecommendation {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  sku: string | null;
}

// Criteria extracted from conversation
export interface ProductCriteria {
  keywords: string[];       // Keywords to match in name/description
  category?: string;        // Category if mentioned
  priceRange?: {
    min?: number;
    max?: number;
  };
}

// Extract criteria from conversation using Gemini
export async function extractProductCriteria(
  conversation: string
): Promise<ProductCriteria> {
  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `Analyze this conversation and extract product search criteria.

Conversation:
${conversation}

Return JSON with:
- keywords: array of relevant product keywords/features mentioned
- category: product category if mentioned (optional)

Only include criteria that are clearly stated. Be specific.
Return valid JSON only, no markdown.`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    // Clean potential markdown code blocks
    const cleaned = text.replace(/```json\n?|\n?```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return { keywords: [] };
  }
}

// Find matching products based on criteria
export async function findMatchingProducts(
  brandId: string,
  criteria: ProductCriteria,
  limit: number = 3
): Promise<ProductRecommendation[]> {
  const supabase = await createClient();

  // Start with products for this brand
  const query = supabase
    .from('products')
    .select(`
      id,
      name,
      description,
      sku,
      images:product_images(image_url, is_hero)
    `)
    .eq('brand_id', brandId);

  // Get all products for this brand (we'll filter in memory for keyword matching)
  const { data: products, error } = await query;

  if (error || !products?.length) {
    return [];
  }

  // Score products by keyword matches
  const scored = products.map(product => {
    let score = 0;
    const searchText = `${product.name} ${product.description || ''}`.toLowerCase();

    for (const keyword of criteria.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += 1;
      }
    }

    return { product, score };
  });

  // Sort by score and take top matches
  const matches = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(s => {
      const heroImage = s.product.images?.find((img: { is_hero: boolean }) => img.is_hero);
      const firstImage = s.product.images?.[0];

      return {
        id: s.product.id,
        name: s.product.name,
        description: s.product.description,
        sku: s.product.sku,
        imageUrl: heroImage?.image_url || firstImage?.image_url || null,
      };
    });

  return matches;
}
