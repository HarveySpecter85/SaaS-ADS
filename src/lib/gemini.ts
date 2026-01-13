import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export const gemini = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

export interface ExtractedBrandData {
  name: string;
  description: string;
  colors: Array<{
    hex_code: string;
    name: string | null;
    usage: string | null;
    is_primary: boolean;
  }>;
  fonts: Array<{
    font_family: string;
    font_weight: string | null;
    usage: string | null;
    is_primary: boolean;
  }>;
  tone: Array<{
    descriptor: string;
    example: string | null;
  }>;
}

export async function extractBrandFromText(pdfText: string): Promise<ExtractedBrandData> {
  const prompt = `Extract brand guidelines from this PDF text. Return ONLY valid JSON matching this structure:

{
  "name": "Brand name",
  "description": "Brief brand description",
  "colors": [
    {"hex_code": "#FFFFFF", "name": "Primary White", "usage": "Backgrounds", "is_primary": true}
  ],
  "fonts": [
    {"font_family": "Helvetica", "font_weight": "Bold", "usage": "Headlines", "is_primary": true}
  ],
  "tone": [
    {"descriptor": "Professional", "example": "We speak with authority..."}
  ]
}

Rules:
- Extract ALL colors mentioned (hex codes). If no hex provided, skip that color.
- Extract ALL fonts mentioned.
- Extract tone of voice descriptors and examples.
- is_primary should be true for the main/primary variant.
- Return empty arrays if category not found.
- Return ONLY the JSON, no markdown or explanation.

PDF Text:
${pdfText.slice(0, 15000)}`;

  const result = await gemini.generateContent(prompt);
  const text = result.response.text();

  // Parse JSON from response (handle potential markdown wrapping)
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Failed to extract JSON from Gemini response');
  }

  return JSON.parse(jsonMatch[0]) as ExtractedBrandData;
}
