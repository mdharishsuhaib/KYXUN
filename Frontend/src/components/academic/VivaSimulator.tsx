"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { Mic, RotateCcw, Square, Sparkles, Volume2, CheckCircle, AlertTriangle, Languages, Loader2 } from "lucide-react";
import type { StudyPlan } from "@/lib/academic";
import { buildVivaQuestions } from "@/lib/academic";
import FeatureCard from "./FeatureCard";
import { vivaService } from "@/lib/services/vivaService";

interface SpeechRecognitionResultList {
  [index: number]: {
    [index: number]: {
      transcript: string;
    };
    length: number;
  };
  length: number;
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

interface Props {
  plan: StudyPlan;
  subject: string;
  onScoreSubmit?: (score: number) => void;
}

interface EvaluationResult {
  score: number;
  conceptualAccuracy: number;
  confidenceScore: number;
  strengths: string[];
  weaknesses: string[];
  feedback: string;
  confidenceAnalysisFeedback: string;
}

interface GlossaryItem {
  english: string;
  tamil: string;
  hindi: string;
}

export default function VivaSimulator({ plan, subject, onScoreSubmit }: Props) {
  const questions = useMemo(() => {
    if (plan.vivaQuestions && plan.vivaQuestions.length > 0) {
      return plan.vivaQuestions.map((q: { question: string, modelAnswer: string, difficulty?: string }, idx: number) => ({
        id: `viva-ai-${idx}`,
        question: q.question,
        modelAnswer: q.modelAnswer,
        difficulty: q.difficulty || "Core"
      }));
    }
    return buildVivaQuestions(plan, subject);
  }, [plan, subject]);
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [showCoach, setShowCoach] = useState(false);
  
  // Multilingual & Sarvam states
  const [language, setLanguage] = useState<"en-IN" | "ta-IN" | "hi-IN">("en-IN");
  const [translatedQuestion, setTranslatedQuestion] = useState("");
  const [translatedModelAnswer, setTranslatedModelAnswer] = useState("");
  const [isTranslatingQuestion, setIsTranslatingQuestion] = useState(false);
  
  // Voice Recording & API states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioMode, setAudioMode] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  
  // TTS Audio state
  const [isPlayingAudio, setIsPlayingAudio] = useState<string | null>(null); // 'question' | 'ideal' | 'feedback' | null
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Dynamic Glossary state
  const [glossary, setGlossary] = useState<GlossaryItem[]>([]);
  const [isTranslatingGlossary, setIsTranslatingGlossary] = useState(false);

  // MediaRecorder references
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Web Speech API client fallback references
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const current = questions[index];

  // Initialize Speech Recognition fallback
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognitionClass = (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).SpeechRecognition ||
        (window as Window & { SpeechRecognition?: new () => SpeechRecognitionInstance; webkitSpeechRecognition?: new () => SpeechRecognitionInstance }).webkitSpeechRecognition;
      if (SpeechRecognitionClass) {
        const rec = new SpeechRecognitionClass();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = language;
        
        rec.onresult = (e: SpeechRecognitionEvent) => {
          let text = "";
          for (let i = e.resultIndex; i < e.results.length; i++) {
            text += e.results[i][0].transcript;
          }
          if (text) setAnswer(text);
        };

        rec.onend = () => {
          // Keep recording active until stopped manually
          if (isRecording && mediaRecorderRef.current?.state === "recording") {
            try { rec.start(); } catch {}
          }
        };

        recognitionRef.current = rec;
      }
    }
  }, [language, isRecording]);

  // Load Translated Question and Ideal Model Answer when index or language changes
  useEffect(() => {
    const syncQuestionLanguage = async () => {
      setAnswer("");
      setEvaluation(null);
      setShowCoach(false);
      stopAudioPlayback();

      if (language === "en-IN") {
        setTranslatedQuestion(current.question);
        setTranslatedModelAnswer(current.modelAnswer);
        return;
      }

      setIsTranslatingQuestion(true);
      try {
        // Translate question
        const resQ = await fetch("/api/viva/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: current.question,
            targetLanguage: language,
            sourceLanguage: "en-IN"
          })
        });
        const dataQ = await resQ.json();
        setTranslatedQuestion(dataQ.translatedText || current.question);

        // Translate model answer
        const resA = await fetch("/api/viva/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            text: current.modelAnswer,
            targetLanguage: language,
            sourceLanguage: "en-IN"
          })
        });
        const dataA = await resA.json();
        setTranslatedModelAnswer(dataA.translatedText || current.modelAnswer);
      } catch (err) {
        console.error("Translation sync failed:", err);
        setTranslatedQuestion(current.question);
        setTranslatedModelAnswer(current.modelAnswer);
      } finally {
        setIsTranslatingQuestion(false);
      }
    };

    syncQuestionLanguage();
  }, [index, language, current]);

  // Fetch glossary definitions on component load
  useEffect(() => {
    const translateGlossary = async () => {
      if (!plan.mustStudy || plan.mustStudy.length === 0) return;
      setIsTranslatingGlossary(true);
      const terms = plan.mustStudy.slice(0, 3);
      try {
        const results = await Promise.all(
          terms.map(async (term) => {
            // Translate to Tamil
            const resTa = await fetch("/api/viva/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: term, targetLanguage: "ta-IN" })
            });
            const dataTa = await resTa.json();

            // Translate to Hindi
            const resHi = await fetch("/api/viva/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ text: term, targetLanguage: "hi-IN" })
            });
            const dataHi = await resHi.json();

            return {
              english: term,
              tamil: dataTa.translatedText || term,
              hindi: dataHi.translatedText || term
            };
          })
        );
        setGlossary(results);
      } catch (err) {
        console.error("Glossary translation failed:", err);
      } finally {
        setIsTranslatingGlossary(false);
      }
    };

    translateGlossary();
  }, [plan]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  const nextQuestion = () => {
    setIndex((value) => (value + 1) % questions.length);
  };

  const startRecording = async () => {
    setAudioMode(true);
    setIsRecording(true);
    setEvaluation(null);
    setAnswer("");
    audioChunksRef.current = [];

    // Trigger Browser Speech Recognition live transcription fallback
    if (recognitionRef.current) {
      try {
        recognitionRef.current.lang = language;
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Client speech recognition failed to start:", e);
      }
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all audio tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await uploadAndTranscribe(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(250); // Slice audio every 250ms
    } catch (err) {
      console.error("Microphone access denied or unsupported:", err);
      // If mic failed, keep state so they can use Web Speech or Type
      setIsRecording(false);
      alert("Microphone access is unavailable. Please type your answer or check system permissions.");
    }
  };

  const stopRecording = () => {
    setIsRecording(false);

    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    } else {
      // If MediaRecorder failed but we typed/simulated
      setIsTranscribing(false);
      evaluateSpokenResponse(answer);
    }
  };

  const uploadAndTranscribe = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    try {
      const fd = new FormData();
      fd.append("file", audioBlob);
      fd.append("language_code", language);

      const res = await fetch("/api/viva/transcribe", {
        method: "POST",
        body: fd
      });
      if (!res.ok) throw new Error("STT failed");
      const data = await res.json();
      
      // If Web Speech already populated, choose whichever is longer/better
      const finalTranscript = data.transcript || answer;
      setAnswer(finalTranscript);
      setIsTranscribing(false);
      
      // Proceed to evaluate the answer
      await evaluateSpokenResponse(finalTranscript);

    } catch (err) {
      console.error("STT API failed:", err);
      setIsTranscribing(false);
      // Fallback: evaluate whatever text is already in the answer field from webkitSpeech
      evaluateSpokenResponse(answer);
    }
  };

  const evaluateSpokenResponse = async (text: string) => {
    if (!text || text.trim() === "") return;
    setIsEvaluating(true);
    try {
      const res = await fetch("/api/viva/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: current.question,
          modelAnswer: current.modelAnswer,
          transcript: text,
          language: language
        })
      });
      if (!res.ok) throw new Error("Evaluation failed");
      const data = (await res.json()) as EvaluationResult;
      setEvaluation(data);

      if (onScoreSubmit) {
        onScoreSubmit(data.score);
      }

      // Sync attempt to Supabase
      const { supabase } = await import("@/lib/supabase");
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id && plan?.id) {
        try {
          await vivaService.saveVivaAttempt(user.id, plan.id, {
            question: current.question,
            user_answer: text,
            model_answer: current.modelAnswer,
            accuracy_score: data.score,
            confidence_score: data.confidenceScore,
            feedback: data.feedback,
            confidence_feedback: data.confidenceAnalysisFeedback
          });
        } catch (dbErr) {
          console.error("Failed to save viva attempt to database:", dbErr);
        }
      }
    } catch (err) {
      console.error("Grading failed:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  // Speaks out target text using Sarvam TTS (with browser SpeechSynthesis fallback)
  const speakText = async (textToSpeak: string, type: "question" | "ideal" | "feedback") => {
    if (isPlayingAudio === type) {
      stopAudioPlayback();
      return;
    }

    stopAudioPlayback();
    setIsPlayingAudio(type);

    // 1. Try Sarvam TTS API
    try {
      const res = await fetch("/api/viva/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: textToSpeak, languageCode: language })
      });
      const data = await res.json();

      if (data.audioContent) {
        const audioUrl = `data:audio/wav;base64,${data.audioContent}`;
        const audio = new Audio(audioUrl);
        audio.onended = () => setIsPlayingAudio(null);
        audioRef.current = audio;
        audio.play();
        return;
      }
    } catch (err) {
      console.warn("Sarvam TTS API failed, trying browser fallback speech...", err);
    }

    // 2. Browser SpeechSynthesis Fallback
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel(); // Clear any playing voice
      
      const utterance = new SpeechSynthesisUtterance(textToSpeak);
      // Map BCP47 codes
      if (language === "ta-IN") utterance.lang = "ta-IN";
      else if (language === "hi-IN") utterance.lang = "hi-IN";
      else utterance.lang = "en-IN";

      utterance.onend = () => setIsPlayingAudio(null);
      utterance.onerror = () => setIsPlayingAudio(null);

      window.speechSynthesis.speak(utterance);
    } else {
      setIsPlayingAudio(null);
    }
  };

  const stopAudioPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlayingAudio(null);
  };

  return (
    <FeatureCard
      eyebrow="Oral Defense Co-Pilot"
      title="Multilingual AI Viva Coach"
      icon={Mic}
      action={
        <div className="flex items-center gap-3">
          {/* Language Switcher Tabs */}
          <div className="flex rounded-xl bg-[var(--kyxun-hover-bg)] border kyxun-border p-1">
            <button
              onClick={() => setLanguage("en-IN")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                language === "en-IN" ? "bg-indigo-600 text-white shadow-sm" : "kyxun-text-muted hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage("hi-IN")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                language === "hi-IN" ? "bg-indigo-600 text-white shadow-sm" : "kyxun-text-muted hover:text-white"
              }`}
            >
              हिन्दी
            </button>
            <button
              onClick={() => setLanguage("ta-IN")}
              className={`px-3 py-1 text-[10px] font-bold rounded-lg transition-all cursor-pointer ${
                language === "ta-IN" ? "bg-indigo-600 text-white shadow-sm" : "kyxun-text-muted hover:text-white"
              }`}
            >
              தமிழ்
            </button>
          </div>

          <button 
            type="button" 
            onClick={nextQuestion} 
            className="w-9 h-9 rounded-xl border kyxun-border bg-[var(--kyxun-hover-bg)] flex items-center justify-center kyxun-hover kyxun-text cursor-pointer" 
            aria-label="Next question"
            title="Next question"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.1fr] gap-6">
        
        {/* Left column: Dynamic Question Panel */}
        <div className="rounded-2xl p-6 border kyxun-border bg-[var(--kyxun-hover-bg)] relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider   kyxun-badge-indigo px-2.5 py-1 rounded-full">
                {current.difficulty} Viva
              </span>
              <span className="text-xs font-mono kyxun-text-muted">{index + 1} / {questions.length}</span>
            </div>
            
            {isTranslatingQuestion ? (
              <div className="h-28 flex flex-col items-center justify-center gap-2">
                <Loader2 className="w-6 h-6   animate-spin" />
                <p className="text-[10px] font-mono kyxun-text-muted">Translating question using Sarvam AI...</p>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="font-outfit text-lg font-bold kyxun-text leading-snug">
                  &ldquo;{translatedQuestion || current.question}&rdquo;
                </h3>
                <button
                  onClick={() => speakText(translatedQuestion || current.question, "question")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border kyxun-border bg-[var(--kyxun-hover-bg)] text-[10px] font-bold kyxun-text-muted hover:kyxun-text hover:bg-[var(--kyxun-hover-bg)] transition-all cursor-pointer"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isPlayingAudio === "question" ? "Stop Voice" : "Listen to Question"}
                </button>
              </div>
            )}
          </div>

          {/* Multilingual Glossary support */}
          {glossary.length > 0 && (
            <div className="mt-8 border-t kyxun-border pt-4">
              <h4 className="text-[10px] uppercase font-bold tracking-wider kyxun-text-muted flex items-center gap-1.5 mb-2.5">
                <Languages className="w-3.5 h-3.5  " />
                Glossary Trainer
              </h4>
              {isTranslatingGlossary ? (
                <div className="flex items-center gap-2 py-1">
                  <Loader2 className="w-3 h-3 kyxun-text-muted animate-spin" />
                  <span className="text-[9px] font-mono kyxun-text-muted">Translating key terms...</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {glossary.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-[var(--kyxun-hover-bg)] border kyxun-border px-3 py-2 rounded-xl text-[10px]">
                      <div className="truncate">
                        <span className="font-bold kyxun-text">{item.english}</span>
                        <span className="kyxun-text-muted mx-1.5">→</span>
                        <span className="  font-semibold">
                          {language === "ta-IN" ? item.tamil : language === "hi-IN" ? item.hindi : `${item.tamil} / ${item.hindi}`}
                        </span>
                      </div>
                      <button
                        onClick={() => speakText(language === "ta-IN" ? item.tamil : language === "hi-IN" ? item.hindi : item.english, "ideal")}
                        className="kyxun-text-muted hover:  shrink-0 cursor-pointer"
                        title="Pronounce"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right column: Interactive spoken practice console */}
        <div className="space-y-4">
          
          {/* Recorder Dashboard */}
          {audioMode ? (
            <div className="p-4 rounded-2xl border   bg-indigo-500/5 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold   flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full bg-red-500 ${isRecording ? "animate-pulse" : ""}`} /> 
                  Oral Practice Active
                </span>
                <span className="text-xs font-mono kyxun-text-muted">
                  {Math.floor(recordingSeconds / 60)}:{(recordingSeconds % 60).toString().padStart(2, "0")}
                </span>
              </div>
              
              <div className="h-16 flex items-center justify-center gap-1 my-4">
                {isRecording ? (
                  // Bouncing visual waveform
                  Array.from({ length: 15 }).map((_, i) => (
                    <div 
                      key={i} 
                      className="w-1 bg-indigo-400 rounded-full audio-bar" 
                      style={{ 
                        animationDelay: `${i * 0.08}s`,
                        animationDuration: `${0.6 + ((i * 7) % 8) * 0.1}s`
                      }} 
                    />
                  ))
                ) : isTranscribing ? (
                  <div className="flex flex-col items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-5 h-5   animate-spin" />
                    <span className="text-xs   font-mono">Transcribing using Sarvam Saaras...</span>
                  </div>
                ) : isEvaluating ? (
                  <div className="flex flex-col items-center gap-1.5 animate-pulse">
                    <Loader2 className="w-5 h-5   animate-spin" />
                    <span className="text-xs   font-mono">Analyzing spoken accuracy & confidence...</span>
                  </div>
                ) : (
                  <div className="text-[10px] kyxun-text-muted font-mono text-center">
                    Microphone paused.<br />Click Resume to practice speaking.
                  </div>
                )}
              </div>

              {/* Spoken output live preview */}
              {answer && (
                <div className="p-3 bg-[var(--kyxun-hover-bg)] border kyxun-border rounded-xl text-[11px] leading-relaxed kyxun-text-muted max-h-24 overflow-y-auto mb-4 font-mono">
                  <span className="font-bold   mr-1.5">Transcript:</span>
                  {answer}
                </div>
              )}

              <div className="flex gap-2">
                {isRecording ? (
                  <button 
                    type="button" 
                    onClick={stopRecording} 
                    className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-lg shadow-red-500/10"
                  >
                    <Square className="w-3.5 h-3.5" /> Stop & Evaluate
                  </button>
                ) : (
                  <button 
                    type="button" 
                    onClick={startRecording} 
                    disabled={isTranscribing || isEvaluating}
                    className="flex-1 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-lg shadow-indigo-500/15"
                  >
                    <Mic className="w-3.5 h-3.5" /> Resume Recording
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={() => setAudioMode(false)} 
                  disabled={isTranscribing || isEvaluating}
                  className="px-3 py-2 rounded-xl border kyxun-border hover:bg-[var(--kyxun-hover-bg)] kyxun-text-muted hover:kyxun-text font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  Type Mode
                </button>
              </div>
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={answer}
                onChange={(event) => setAnswer(event.target.value)}
                disabled={isTranscribing || isEvaluating}
                placeholder={
                  language === "ta-IN" 
                    ? "விடையை இங்கே தட்டச்சு செய்யவும் அல்லது பேச மைக்ரோஃபோனை அழுத்தவும்..." 
                    : language === "hi-IN"
                      ? "अपना उत्तर यहाँ टाइप करें या बोलने के लिए माइक दबाएँ..."
                      : "Type your spoken answer here or click the microphone to speak..."
                }
                className="input-field min-h-36 resize-y leading-relaxed disabled:opacity-75 text-xs font-mono bg-[var(--kyxun-hover-bg)] kyxun-border"
              />
              <div className="absolute right-3.5 bottom-3.5 flex gap-2">
                {answer.trim().length > 10 && (
                  <button
                    type="button"
                    onClick={() => evaluateSpokenResponse(answer)}
                    disabled={isEvaluating || isTranscribing}
                    className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isEvaluating ? "Grading..." : "Submit Answer"}
                  </button>
                )}
                <button 
                  type="button" 
                  onClick={startRecording} 
                  disabled={isTranscribing || isEvaluating}
                  className="p-2 rounded-lg bg-[var(--kyxun-hover-bg)] hover:bg-[var(--kyxun-hover-bg)] border kyxun-border kyxun-text-muted hover:kyxun-text transition-all cursor-pointer disabled:opacity-50 animate-pulse"
                  title="Use voice mode"
                >
                  <Mic className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* AI Telemetry Results */}
          {evaluation && (
            <div className="space-y-4 animate-fade-in">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl p-2.5 border kyxun-border bg-[var(--kyxun-hover-bg)] text-center">
                  <p className="text-[9px] kyxun-text-muted uppercase font-bold tracking-wider">Viva Score</p>
                  <p className="text-lg font-black kyxun-text mt-0.5">
                    {evaluation.score}<span className="text-[10px] kyxun-text-muted ml-0.5">/100</span>
                  </p>
                </div>
                <div className="rounded-xl p-2.5 border kyxun-border bg-[var(--kyxun-hover-bg)] text-center">
                  <p className="text-[9px] kyxun-text-muted uppercase font-bold tracking-wider">Accuracy</p>
                  <p className="text-lg font-black   mt-0.5">
                    {evaluation.conceptualAccuracy}%
                  </p>
                </div>
                <div className="rounded-xl p-2.5 border kyxun-border bg-[var(--kyxun-hover-bg)] text-center">
                  <p className="text-[9px] kyxun-text-muted uppercase font-bold tracking-wider">Confidence</p>
                  <p className="text-lg font-black text-emerald-400 mt-0.5">
                    {evaluation.confidenceScore}%
                  </p>
                </div>
              </div>

              {/* Structurced strengths and weaknesses */}
              <div className="glass-panel p-4 rounded-2xl border kyxun-border space-y-3">
                <div className="space-y-2">
                  <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle className="w-3.5 h-3.5" /> Strengths
                  </p>
                  <ul className="space-y-1 text-[10px] kyxun-text-muted pl-1 list-disc list-inside leading-relaxed font-medium">
                    {evaluation.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                  </ul>
                </div>

                <div className="space-y-2 border-t kyxun-border pt-2.5">
                  <p className="text-[10px] font-bold text-amber-500 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" /> Improvements Needed
                  </p>
                  <ul className="space-y-1 text-[10px] kyxun-text-muted pl-1 list-disc list-inside leading-relaxed font-medium">
                    {evaluation.weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)}
                  </ul>
                </div>
              </div>

              {/* Feedback and Pacing report */}
              <div className="p-4 rounded-2xl border   bg-indigo-500/5 space-y-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider   mb-1">Grading Feedback</p>
                  <p className="text-xs kyxun-text-muted leading-relaxed font-medium">{evaluation.feedback}</p>
                </div>

                {evaluation.confidenceAnalysisFeedback && (
                  <div className="border-t border-indigo-500/10 pt-2 text-[10px] text-emerald-400/80 italic leading-relaxed">
                    <span className="font-bold uppercase not-italic text-[9px] mr-1 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">Fluency Telemetry</span>
                    {evaluation.confidenceAnalysisFeedback}
                  </div>
                )}

                <button
                  onClick={() => speakText(evaluation.feedback, "feedback")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-500/30 kyxun-badge-indigo text-[10px] font-bold   hover:text-white hover:bg-indigo-600/20 transition-all cursor-pointer mt-1"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  {isPlayingAudio === "feedback" ? "Stop Playing" : "Listen to Feedback"}
                </button>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCoach((value) => !value)}
            className="w-full py-3.5 rounded-xl text-xs font-bold kyxun-text transition-all cursor-pointer shadow-md hover:shadow-purple-500/10 flex items-center justify-center gap-1.5"
            style={{ background: "linear-gradient(135deg, var(--kyxun-accent), var(--kyxun-accent-secondary))" }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            {showCoach ? "Hide Coach Answer" : "Show Coach Answer"}
          </button>

          {showCoach && (
            <div className="rounded-2xl p-4 border   bg-indigo-500/5 relative overflow-hidden space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-[10px] font-bold uppercase tracking-wider  ">Ideal Coach Template</p>
                <button
                  onClick={() => speakText(translatedModelAnswer || current.modelAnswer, "ideal")}
                  className="kyxun-text-muted hover:  cursor-pointer"
                  title="Speak Answer"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs kyxun-text-muted leading-relaxed font-medium">{translatedModelAnswer || current.modelAnswer}</p>
            </div>
          )}
        </div>

      </div>
    </FeatureCard>
  );
}
