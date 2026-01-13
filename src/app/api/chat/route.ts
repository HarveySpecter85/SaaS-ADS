import { NextRequest } from 'next/server';
import { streamChatResponse, ChatMessage, ChatContext } from '@/lib/chat';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
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

      // Fetch products for this brand
      const { data: products } = await supabase
        .from('products')
        .select('name')
        .eq('brand_id', brandId);

      if (products?.length) {
        context.productNames = products.map(p => p.name);
      }
    }

    // Create streaming response
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatResponse(messages, context)) {
            controller.enqueue(encoder.encode(chunk));
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
