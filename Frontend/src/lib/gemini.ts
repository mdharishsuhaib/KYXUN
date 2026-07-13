import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
export const GEMINI_MODEL_NAME = process.env.GEMINI_MODEL || "gemini-1.5-flash";

export const geminiTextModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL_NAME,
  generationConfig: {
    temperature: 0.3,
  },
});

export const geminiJsonModel = genAI.getGenerativeModel({
  model: GEMINI_MODEL_NAME,
  generationConfig: {
    responseMimeType: "application/json",
    temperature: 0.3,
  },
});

type GeminiModel = typeof geminiTextModel;
type GenerateContentInput = Parameters<GeminiModel["generateContent"]>[0];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /\b(429|500|502|503|504|rate|quota|timeout|temporar|overloaded|unavailable)\b/i.test(message);
}

export async function generateTextWithRetry(
  model: GeminiModel,
  input: GenerateContentInput,
  attempts = 3
): Promise<string> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      const result = await model.generateContent(input);
      const response = await result.response;
      return response.text();
    } catch (error) {
      lastError = error;
      if (attempt === attempts || !isRetryableError(error)) break;
      await delay(500 * attempt);
    }
  }

  throw lastError;
}

export function parseGeminiJson<T>(text: string): T | null {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();

  try {
    return JSON.parse(cleaned) as T;
  } catch {
    const firstBrace = cleaned.indexOf("{");
    const lastBrace = cleaned.lastIndexOf("}");

    if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
      return null;
    }

    try {
      return JSON.parse(cleaned.slice(firstBrace, lastBrace + 1)) as T;
    } catch {
      return null;
    }
  }
}
