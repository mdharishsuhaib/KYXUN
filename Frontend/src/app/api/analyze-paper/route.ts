import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";
import { geminiJsonModel, geminiTextModel, generateTextWithRetry, parseGeminiJson } from "@/lib/gemini";

async function fileToText(file: File): Promise<string | null> {
  const buf = await file.arrayBuffer();
  const bytes = Buffer.from(buf);

  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    try {
      const parser = new PDFParse({ data: new Uint8Array(bytes) });
      const data = await parser.getText();
      await parser.destroy();
      if (data.text && data.text.length > 20) {
        return `[PDF content from ${file.name}]\n${data.text.slice(0, 10000)}`;
      }
    } catch (e) {
      console.warn("PDF parse failed for", file.name, e);
    }
  }

  if (
    file.type === "text/plain" ||
    file.type === "text/csv" ||
    file.type === "text/markdown" ||
    /\.(txt|md|csv|log)$/i.test(file.name)
  ) {
    const text = new TextDecoder("utf-8", { fatal: false }).decode(buf);
    return `[File: ${file.name}]\n${text.slice(0, 8000)}`;
  }

  if (
    /\.(docx?|rtf|odt|odf)$/i.test(file.name) ||
    file.type.includes("word") ||
    file.type.includes("opendocument")
  ) {
    if (/\.docx$/i.test(file.name) || file.type.includes("wordprocessingml")) {
      try {
        const result = await mammoth.extractRawText({ buffer: bytes });
        const text = result.value.replace(/\s+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
        if (text.length > 40) return `[Extracted from ${file.name}]\n${text.slice(0, 8000)}`;
      } catch (e) {
        console.warn("Mammoth DOCX parse failed for", file.name, e);
      }
    }
    return null;
  }

  if (
    file.type.startsWith("image/") ||
    /\.(jpe?g|png|gif|webp|bmp|tiff?)$/i.test(file.name)
  ) {
    try {
      const base64 = bytes.toString("base64");
      const mimeType = file.type || "image/jpeg";

      const extracted = (await generateTextWithRetry(geminiTextModel, [
        {
          inlineData: {
            mimeType,
            data: base64,
          },
        },
        "Extract ALL visible text. Return only extracted text.",
      ])).trim();

      if (extracted.length > 10) {
        return `[Image content from ${file.name}]\n${extracted.slice(0, 6000)}`;
      }
    } catch {
      // Vision extraction failed silently
    }
    return null;
  }

  return null;
}

function analysisError(details: string, status = 500) {
  return Response.json(
    {
      error: "Unable to analyze uploaded paper.",
      details,
    },
    { status }
  );
}

function buildPaperAnalysisPrompt(
  subject: string,
  paperText: string,
  extractedFileTexts: string[]
) {
  const paperContent = [
    paperText ? `PASTED PAPER TEXT:\n${paperText}` : "",
    extractedFileTexts.length > 0 ? `EXTRACTED PAPER FILES:\n${extractedFileTexts.join("\n\n")}` : ""
  ].filter(Boolean).join("\n\n").slice(0, 12000);

  return `You are an elite exam prediction AI. Analyze the following previous year question papers or exam questions for the subject "${subject}" and extract exam pattern intelligence.

EXAM CONTENT TO ANALYZE:
${paperContent}

YOUR TASK:
Extract exam trends and structure them as a valid JSON object matching the following structure:
{
  "frequentlyAskedTopics": [
    {
      "topic": "<topic name>",
      "frequency": <number of occurrences, e.g. 5>,
      "examWeightage": "<e.g., 18%>",
      "studyPriority": "<Critical|High Yield|Medium Yield|Skip>",
      "patternDetails": "<how it typically appears in the exam paper>"
    }
  ],
  "questionPatterns": [
    "<pattern observation 1>",
    "<pattern observation 2>"
  ],
  "predictedHighValueChapters": [
    {
      "chapterName": "<chapter name>",
      "predictedWeightage": "<e.g., 25%>",
      "reason": "<reasoning detail>"
    }
  ]
}

CRITICAL RULES:
- Return ONLY valid JSON with no markdown formatting or commentary.
- Topic names must be specific and extracted from the provided text.
- Estimated weights and frequencies must be realistic and derived from the paper content.
- Ensure all text is grammatically correct and has no typos.`;
}

export async function POST(request: Request) {
  let subject = "General";
  let paperText = "";
  let files: File[] = [];

  try {
    const fd = await request.formData();
    subject = (fd.get("subject") as string) || "General";
    paperText = (fd.get("paperText") as string) || "";
    files = fd.getAll("files") as File[];
  } catch {
    return analysisError("Invalid form data.", 400);
  }

  try {
    const extractedFileTexts: string[] = [];
    if (files.length > 0) {
      const results = await Promise.all(files.map(fileToText));
      results.forEach((t) => t && extractedFileTexts.push(t));
    }

    if (!paperText && extractedFileTexts.length === 0) {
      return analysisError("No readable paper text was provided.", 400);
    }

    const prompt = buildPaperAnalysisPrompt(subject, paperText, extractedFileTexts);

    const text = await generateTextWithRetry(geminiJsonModel, prompt);

    const data = parseGeminiJson(text);
    if (!data) {
      return analysisError("Gemini returned invalid JSON.");
    }

    return Response.json(data);
  } catch (err) {
    console.error("[analyze-paper/route] AI call failed:", err);
    return analysisError("Gemini request failed.");
  }
}
