export function extractJson(text: string): unknown {
  const cleaned = text
    .replace(/```json/gi, '')
    .replace(/```/g, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (error: unknown) {
    console.error('❌ JSON parse failed:', error);
    console.error('↳ Raw LLM output:\n', text);
    throw new Error('Invalid JSON returned by LLM');
  }
}
