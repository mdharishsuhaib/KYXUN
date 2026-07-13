import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const { text, languageCode } = await request.json();
    const toLang = languageCode || "en-IN";

    if (!text || text.trim() === "") {
      return NextResponse.json({ audioContent: "" });
    }

    const sarvamKey = process.env.SARVAM_API_KEY ?? "";
    if (!sarvamKey || sarvamKey === "your_sarvam_api_key_here") {
      console.log("Sarvam API Key missing. Skipping server-side TTS, client will use browser synthesis fallback.");
      return NextResponse.json({ audioContent: "", source: "fallback" });
    }

    // Call Sarvam TTS API
    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": sarvamKey
      },
      body: JSON.stringify({
        text: text,
        target_language_code: toLang,
        speaker: "shubh",
        model: "bulbul:v3"
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam TTS failed:", response.status, errorText);
      return NextResponse.json({ audioContent: "", source: "fallback" });
    }

    const data = await response.json();
    const audioContent = data.audios && data.audios.length > 0 ? data.audios[0] : "";
    
    return NextResponse.json({ audioContent, source: "sarvam" });

  } catch (error) {
    console.error("[viva/tts] API error:", error);
    return NextResponse.json(
      { error: "Text-to-speech synthesis failed" },
      { status: 500 }
    );
  }
}
