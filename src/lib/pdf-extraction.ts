import { extractText } from 'unpdf';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const uint8Array = new Uint8Array(buffer);
  const { text } = await extractText(uint8Array);
  return text.join('\n');
}
