import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as Blob | null;
    const languageCode = (formData.get("language_code") as string) || "en-IN";

    if (!file) {
      return NextResponse.json(
        { error: "No audio file provided" },
        { status: 400 }
      );
    }

    const sarvamKey = process.env.SARVAM_API_KEY ?? "";
    if (!sarvamKey || sarvamKey === "your_sarvam_api_key_here") {
      console.error("Sarvam API Key missing. Transcription cannot proceed.");
      return NextResponse.json(
        { error: "Transcription service is currently unavailable. Please configure the STT API Key." },
        { status: 503 }
      );
    }

    // Prepare multipart form data for Sarvam STT
    const sarvamFormData = new FormData();
    sarvamFormData.append("file", file, "audio.wav");
    sarvamFormData.append("language_code", languageCode);
    // Saaras model can be saaras:v1 or omitted for defaults
    sarvamFormData.append("model", "saaras:v1");

    const response = await fetch("https://api.sarvam.ai/speech-to-text", {
      method: "POST",
      headers: {
        "api-subscription-key": sarvamKey
        // Note: Do NOT set Content-Type header manually here. fetch will automatically set it with the multipart boundary.
      },
      body: sarvamFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Sarvam STT failed:", response.status, errorText);
      return NextResponse.json(
        { error: `Sarvam STT failed with status ${response.status}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    return NextResponse.json({
      transcript: data.transcript || "",
      source: "sarvam"
    });

  } catch (error) {
    console.error("[viva/transcribe] API error:", error);
    return NextResponse.json(
      { error: "Transcription failed" },
      { status: 500 }
    );
  }
}
