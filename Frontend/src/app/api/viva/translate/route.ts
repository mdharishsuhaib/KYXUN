import { NextResponse } from "next/server";
import { geminiTextModel, generateTextWithRetry } from "@/lib/gemini";

async function geminiTranslate(text: string, fromLang: string, toLang: string): Promise<string> {
  const langNames: Record<string, string> = {
    "en-IN": "English",
    "ta-IN": "Tamil",
    "hi-IN": "Hindi"
  };

  const fromName = langNames[fromLang] || fromLang;
  const toName = langNames[toLang] || toLang;

  try {
    return (await generateTextWithRetry(
      geminiTextModel,
      `You are a professional academic translator. Translate the text from ${fromName} to ${toName}. Keep any technical academic vocabulary accurate. Output ONLY the translated text, with no markdown, quotes, explanations, or conversational filler.\n\n${text}`
    )).trim() || text;
  } catch (err) {
    console.error("Gemini translation error:", err);
    return text;
  }
}

export async function POST(request: Request) {
  try {
    const { text, targetLanguage, sourceLanguage } = await request.json();
    const fromLang = sourceLanguage || "en-IN";
    const toLang = targetLanguage || "en-IN";

    if (!text || text.trim() === "") {
      return NextResponse.json({ translatedText: "" });
    }

    if (fromLang === toLang) {
      return NextResponse.json({ translatedText: text });
    }

    const sarvamKey = process.env.SARVAM_API_KEY ?? "";
    if (!sarvamKey || sarvamKey === "your_sarvam_api_key_here") {
      console.log(`Sarvam API Key missing. Falling back to Gemini for translation: ${fromLang} -> ${toLang}`);
      const translated = await geminiTranslate(text, fromLang, toLang);
      return NextResponse.json({ translatedText: translated, source: "gemini-fallback" });
    }

    // Call Sarvam Translate API
    const response = await fetch("https://api.sarvam.ai/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey
      },
      body: JSON.stringify({
        input: text,
        source_language_code: fromLang,
        target_language_code: toLang,
        model: "sarvam-translate:v1"
      })
    });

    if (!response.ok) {
      console.warn(`Sarvam translation API returned status ${response.status}. Falling back to Gemini.`);
      const translated = await geminiTranslate(text, fromLang, toLang);
      return NextResponse.json({ translatedText: translated, source: "gemini-fallback" });
    }

    const data = await response.json();
    const translatedText = data.translated_text || data.translatedText || "";
    return NextResponse.json({ translatedText, source: "sarvam" });

  } catch (error) {
    console.error("[viva/translate] API error:", error);
    return NextResponse.json(
      { error: "Translation failed" },
      { status: 500 }
    );
  }
}
