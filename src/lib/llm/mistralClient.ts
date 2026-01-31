// src/llm/mistralClient.ts

const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
const MISTRAL_URL = 'https://api.mistral.ai/v1/chat/completions';

if (!MISTRAL_API_KEY) {
  throw new Error('Missing MISTRAL_API_KEY in env');
}

export interface MistralMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function callMistral(messages: MistralMessage[]): Promise<string> {
  const response = await fetch(MISTRAL_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MISTRAL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'mistral-small-latest',
      temperature: 0.2,
      messages,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('❌ Mistral API error:', text);
    throw new Error('Mistral API call failed');
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  if (!content) {
    console.error('❌ Invalid Mistral response:', data);
    throw new Error('Empty response from Mistral');
  }

  return content;
}
