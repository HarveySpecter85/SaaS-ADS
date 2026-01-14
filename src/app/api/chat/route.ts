import { NextRequest } from 'next/server';
import { streamChatResponse, ChatMessage, ChatContext } from '@/lib/chat';
import { createClient } from '@/lib/supabase/server';
import { requireAuth } from '@/lib/api-auth';
import { extractProductCriteria, findMatchingProducts } from '@/lib/product-matcher';

// Delimiter for recommendations in stream
const RECOMMENDATIONS_DELIMITER = '\n---RECOMMENDATIONS---\n';

export async function POST(request: NextRequest) {
  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    const { messages, brandId } = await request.json() as {
      messages: ChatMessage[];
      brandId?: string;
    };

    if (!messages?.length) {
      return new Response('Messages required', { status: 400 });
    }

    // Build context from brand if provided
    const context: ChatContext = {};

    if (brandId) {
      const supabase = await createClient();

      // Fetch brand with tone
      const { data: brand } = await supabase
        .from('brands')
        .select('name, tone:brand_tone(descriptor)')
        .eq('id', brandId)
        .single();

      if (brand) {
        context.brandName = brand.name;
        context.brandTone = brand.tone?.map((t: { descriptor: string }) => t.descriptor) || [];
      }

      // Fetch products for this brand (with full details for recommendations)
      const { data: products } = await supabase
        .from('products')
        .select('id, name, description')
        .eq('brand_id', brandId);

      if (products?.length) {
        context.productNames = products.map(p => p.name);
        context.products = products;
      }
    }

    // Create streaming response with recommendations
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Collect full response for recommendation analysis
          let fullResponse = '';

          for await (const chunk of streamChatResponse(messages, context)) {
            controller.enqueue(encoder.encode(chunk));
            fullResponse += chunk;
          }

          // Check for product recommendations if we have a brandId and products
          if (brandId && context.products?.length) {
            try {
              // Build conversation text for criteria extraction
              const conversationText = messages
                .map(m => `${m.role}: ${m.content}`)
                .join('\n') + `\nassistant: ${fullResponse}`;

              // Extract criteria from conversation
              const criteria = await extractProductCriteria(conversationText);

              // Find matching products if we have keywords
              if (criteria.keywords.length > 0) {
                const recommendations = await findMatchingProducts(brandId, criteria, 3);

                if (recommendations.length > 0) {
                  // Append recommendations delimiter and JSON
                  controller.enqueue(encoder.encode(RECOMMENDATIONS_DELIMITER));
                  controller.enqueue(encoder.encode(JSON.stringify(recommendations)));
                }
              }
            } catch (recError) {
              // Silently fail recommendations - don't break the chat
              console.error('Recommendation error:', recError);
            }
          }

          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Chat API error:', error);
    return new Response('Internal server error', { status: 500 });
  }
}
