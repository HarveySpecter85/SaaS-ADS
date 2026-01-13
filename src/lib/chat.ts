import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini for chat
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// Chat message type
export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

// Context for brand-aware responses
export interface ChatContext {
  brandName?: string;
  brandTone?: string[];     // Tone descriptors from brand
  productNames?: string[];  // Available products for recommendations
  products?: Array<{        // Full product details for recommendations
    id: string;
    name: string;
    description: string | null;
  }>;
}

// Build system prompt with context
export function buildChatSystemPrompt(context: ChatContext): string {
  let prompt = `You are a helpful product discovery assistant for an online store.
Your goal is to understand what visitors are looking for and help them find the right products.

Guidelines:
- Be conversational and friendly
- Ask clarifying questions to understand needs
- Make specific product recommendations when you have enough information
- Keep responses concise (2-3 sentences max unless explaining products)
- Never make up product information - only recommend products from the catalog
- When you recommend products, mention them by name so the system can show product cards`;

  if (context.brandName) {
    prompt += `\n\nYou represent ${context.brandName}.`;
  }

  if (context.brandTone?.length) {
    prompt += `\n\nBrand voice: ${context.brandTone.join(', ')}.`;
  }

  if (context.productNames?.length) {
    prompt += `\n\nAvailable products: ${context.productNames.join(', ')}.`;
  }

  return prompt;
}

// Create streaming chat response
export async function* streamChatResponse(
  messages: ChatMessage[],
  context: ChatContext
): AsyncGenerator<string, void, unknown> {
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const systemPrompt = buildChatSystemPrompt(context);

  // Build chat history for Gemini
  const history = messages.slice(0, -1).map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }],
  }));

  const chat = model.startChat({
    history,
    systemInstruction: systemPrompt,
  });

  // Get the last user message
  const lastMessage = messages[messages.length - 1];

  // Stream the response
  const result = await chat.sendMessageStream(lastMessage.content);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) {
      yield text;
    }
  }
}
