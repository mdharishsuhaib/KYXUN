import { NextResponse } from "next/server";
import { geminiJsonModel, geminiTextModel, generateTextWithRetry, parseGeminiJson } from "@/lib/gemini";

async function translateText(text: string, fromLang: string, toLang: string): Promise<string> {
  if (!text || text.trim() === "" || fromLang === toLang) return text;

  const sarvamKey = process.env.SARVAM_API_KEY ?? "";
  
  // Try calling Sarvam Translate first
  if (sarvamKey && sarvamKey !== "your_sarvam_api_key_here") {
    try {
      const res = await fetch("https://api.sarvam.ai/translate", {
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
      if (res.ok) {
        const data = await res.json();
        return data.translated_text || data.translatedText || text;
      }
    } catch (e) {
      console.warn("Sarvam translation failed inside evaluate. Trying Gemini fallback...", e);
    }
  }

  const langNames: Record<string, string> = {
    "en-IN": "English",
    "ta-IN": "Tamil",
    "hi-IN": "Hindi"
  };

  try {
    return (await generateTextWithRetry(
      geminiTextModel,
      `You are a professional academic translator. Translate the text from ${langNames[fromLang] || fromLang} to ${langNames[toLang] || toLang}. Keep any technical academic vocabulary accurate. Output ONLY the translated text, with no markdown, quotes, explanations, or conversational filler.\n\n${text}`
    )).trim() || text;
  } catch (err) {
    console.error("Gemini translation error in evaluate:", err);
    return text;
  }
}

export async function POST(request: Request) {
  try {
    const { question, modelAnswer, transcript, language } = await request.json();
    const lang = language || "en-IN";

    if (!transcript || transcript.trim() === "") {
      return NextResponse.json({
        score: 0,
        conceptualAccuracy: 0,
        confidenceScore: 0,
        strengths: ["No spoken answer detected."],
        weaknesses: ["Answer transcript was empty."],
        feedback: "Please record or type your answer before submitting.",
        confidenceAnalysisFeedback: "N/A"
      });
    }

    // 1. Translate Tamil/Hindi input back to English for uniform, high-accuracy LLM grading
    let englishTranscript = transcript;
    if (lang !== "en-IN") {
      console.log(`Translating transcript from ${lang} to en-IN for evaluation...`);
      englishTranscript = await translateText(transcript, lang, "en-IN");
    }

    // 2. Call Gemini for structured grading
    const systemPrompt = `You are an elite IIT Professor and strict viva examiner. Evaluate the student's response with absolute rigor.
Never give generic, motivational, or conversational advice (do not say 'Focus on your studies', 'Practice consistently', or 'Revise regularly'). Focus purely on technical depth, key terminology, and marks potential.

QUESTION: "${question}"
IDEAL MODEL ANSWER: "${modelAnswer}"
STUDENT'S SPOKEN RESPONSE: "${englishTranscript}"

Evaluate the student's answer thoroughly and provide a structured assessment in JSON.
You MUST evaluate:
1. score: An integer from 0 to 100 based strictly on accuracy, completeness, and key technical keyword coverage.
2. conceptualAccuracy: An integer from 0 to 100 for factual correctness.
3. confidenceScore: An integer from 0 to 100 representing confidence. Look for hesitation markers (e.g. 'uh', 'um', pauses), repetition, structural clarity, brevity, or completeness in the transcript.
4. strengths: A list of 2-3 specific technical concepts the student correctly articulated.
5. weaknesses: A list of 2-3 specific missing keywords, logical gaps, or mistakes.
6. feedback: A direct, strict 2-3 sentence paragraph explaining their score and exact technical corrections.
7. confidenceAnalysisFeedback: A 1-2 sentence paragraph analyzing their spoken confidence and keyword precision.

Return ONLY a valid JSON object matching this schema (do not output any markdown code blocks or additional text):
{
  "score": number,
  "conceptualAccuracy": number,
  "confidenceScore": number,
  "strengths": string[],
  "weaknesses": string[],
  "feedback": string,
  "confidenceAnalysisFeedback": string
}`;

    const evaluationText = await generateTextWithRetry(
      geminiJsonModel,
      [
        "You are an elite academic grader. Return ONLY valid JSON with no markdown fences, code blocks, or commentary.",
        systemPrompt,
      ].join("\n\n")
    );
    const evaluationData = parseGeminiJson<any>(evaluationText);
    if (!evaluationData) {
      return NextResponse.json(
        { error: "Grading evaluation failed", details: "Gemini returned invalid JSON." },
        { status: 500 }
      );
    }

    // 3. Translate the feedback outputs back to Hindi or Tamil if the user's primary language is regional
    if (lang !== "en-IN") {
      console.log(`Translating feedback reports back to ${lang}...`);
      
      try {
        const [feedbackTr, confidenceTr, strengthsTr, weaknessesTr] = await Promise.all([
          translateText(evaluationData.feedback, "en-IN", lang),
          translateText(evaluationData.confidenceAnalysisFeedback, "en-IN", lang),
          Promise.all(evaluationData.strengths.map((s: string) => translateText(s, "en-IN", lang))),
          Promise.all(evaluationData.weaknesses.map((w: string) => translateText(w, "en-IN", lang)))
        ]);

        evaluationData.feedback = feedbackTr;
        evaluationData.confidenceAnalysisFeedback = confidenceTr;
        evaluationData.strengths = strengthsTr;
        evaluationData.weaknesses = weaknessesTr;
      } catch (transError) {
        console.error("Failed to translate feedback back to regional language:", transError);
      }
    }

    return NextResponse.json(evaluationData);

  } catch (error) {
    console.error("[viva/evaluate] API error:", error);
    return NextResponse.json(
      { error: "Grading evaluation failed" },
      { status: 500 }
    );
  }
}
