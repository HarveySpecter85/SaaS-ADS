import { extractText } from 'unpdf';

export async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const { text } = await extractText(buffer);
  return text.join('\n');
}
