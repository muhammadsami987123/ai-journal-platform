"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  Keyboard,
  Mic,
  MicOff,
  ShieldCheck,
  Square,
  Upload
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { JournalEntry, Transcript } from "@journal/shared";
import { api, messageForError } from "@/lib/api/client";
import { businessDateIn, cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button, buttonStyles } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Field, Select, Textarea } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { useMe } from "@/hooks/use-me";
import { Waveform } from "./waveform";

/* Minimal local typings: lib.dom still omits the Web Speech API. */
interface SpeechAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechAlternative;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: { length: number; [index: number]: SpeechResult };
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

function recognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  const scope = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return scope.SpeechRecognition ?? scope.webkitSpeechRecognition ?? null;
}

const LANGUAGES = [
  { value: "en-US", label: "English (US)", entry: "en" },
  { value: "en-GB", label: "English (UK)", entry: "en" },
  { value: "ur-PK", label: "Urdu (اردو)", entry: "ur" },
  { value: "hi-IN", label: "Hindi (हिन्दी)", entry: "hi" }
] as const;

type Phase = "idle" | "starting" | "recording" | "review" | "denied" | "error";

export function VoiceJournal() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const me = useMe();

  const [supported, setSupported] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [language, setLanguage] = useState<string>("en-US");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [elapsed, setElapsed] = useState(0);
  const [statusText, setStatusText] = useState("Ready to record.");
  const [error, setError] = useState<string | null>(null);
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);
  const [savedTranscript, setSavedTranscript] = useState<Transcript | null>(null);
  const [fallbackText, setFallbackText] = useState("");
  const [fallbackUploading, setFallbackUploading] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef("");
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const stoppedRef = useRef(true);

  useEffect(() => {
    setSupported(Boolean(recognitionConstructor()));
  }, []);

  const cleanup = () => {
    stoppedRef.current = true;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    setAnalyser(null);
  };

  useEffect(() => () => cleanup(), []);

  async function startRecording() {
    const Constructor = recognitionConstructor();
    if (!Constructor) {
      setSupported(false);
      return;
    }

    setError(null);
    setPhase("starting");
    setStatusText("Requesting microphone permission…");
    setSavedTranscript(null);
    setTranscript("");
    setInterim("");
    finalRef.current = "";
    setElapsed(0);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const audioContext = new AudioContext();
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const node = audioContext.createAnalyser();
      node.fftSize = 128;
      node.smoothingTimeConstant = 0.75;
      source.connect(node);
      setAnalyser(node);

      const recognition = new Constructor();
      recognition.lang = language;
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onresult = (event) => {
        let nextInterim = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (!result) continue;
          const value = result[0]?.transcript ?? "";
          if (result.isFinal) finalRef.current += `${value} `;
          else nextInterim += value;
        }
        setTranscript(finalRef.current.trim());
        setInterim(nextInterim.trim());
      };

      recognition.onerror = (event) => {
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setPhase("denied");
          setError("Microphone access was blocked. Allow it in your browser settings or type instead.");
          setStatusText("Microphone permission denied.");
        } else if (event.error === "no-speech") {
          setError("We didn't hear anything. Try again a little closer to the microphone.");
          setStatusText("No speech detected.");
        } else if (event.error === "network") {
          setError("Speech recognition needs a network connection in this browser.");
          setStatusText("Speech recognition is offline.");
        } else {
          setError("The recording stopped unexpectedly. Your transcript so far is kept below.");
          setStatusText("Recording stopped.");
        }
        cleanup();
        setPhase((current) => (current === "recording" || current === "starting" ? "review" : current));
      };

      recognition.onend = () => {
        if (!stoppedRef.current) stopRecording();
      };

      recognitionRef.current = recognition;
      recognition.start();

      stoppedRef.current = false;
      startedAtRef.current = Date.now();
      timerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 500);

      setPhase("recording");
      setStatusText("Recording. Speak naturally; pauses are fine.");
    } catch (err) {
      cleanup();
      const denied =
        err instanceof DOMException && (err.name === "NotAllowedError" || err.name === "SecurityError");
      setPhase(denied ? "denied" : "error");
      setError(
        denied
          ? "Microphone access was blocked. Allow it in your browser settings, or type this entry instead."
          : "We couldn't reach your microphone. Check that a device is connected and try again."
      );
      setStatusText(denied ? "Microphone permission denied." : "Microphone unavailable.");
    }
  }

  function stopRecording() {
    stoppedRef.current = true;
    recognitionRef.current?.stop();
    recognitionRef.current = null;
    cleanup();
    setInterim("");
    setPhase("review");
    setStatusText("Recording finished. Review the text before saving.");
  }

  const durationMs = elapsed * 1000;

  const saveTranscript = useMutation({
    mutationFn: (entryId?: string) =>
      api.post<Transcript>("/api/v1/transcriptions", {
        text: transcript.trim(),
        language: LANGUAGES.find((item) => item.value === language)?.entry ?? "en",
        provider: "browser",
        duration_ms: durationMs || undefined,
        entry_id: entryId ?? undefined
      }),
    onError: (mutationError) =>
      toast({ title: "Could not save transcript", description: messageForError(mutationError), tone: "error" })
  });

  const createEntry = useMutation({
    mutationFn: async () => {
      const text = transcript.trim();
      if (!text) throw new Error("There is nothing to save yet.");
      const timezone = me.data?.profile.timezone ?? "UTC";
      const entry = await api.post<JournalEntry>("/api/v1/entries", {
        entry_date: businessDateIn(timezone),
        original_text: text,
        language: LANGUAGES.find((item) => item.value === language)?.entry ?? "en"
      });
      try {
        await api.post<Transcript>("/api/v1/transcriptions", {
          text,
          language: LANGUAGES.find((item) => item.value === language)?.entry ?? "en",
          provider: "browser",
          duration_ms: durationMs || undefined,
          entry_id: entry.id
        });
      } catch {
        /* The entry is the important record; the transcript can be re-saved. */
      }
      return entry;
    },
    onSuccess: (entry) => {
      queryClient.invalidateQueries({ queryKey: ["entries"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["calendar"] });
      toast({ title: "Transcript saved with a new entry", description: "Review it, then use the assistant if you want structure." });
      router.push(`/journal/${entry.id}`);
    },
    onError: (mutationError) =>
      toast({ title: "Could not create entry", description: messageForError(mutationError), tone: "error" })
  });

  async function keepTranscript() {
    if (!transcript.trim()) return;
    const saved = await saveTranscript.mutateAsync(undefined).catch(() => null);
    if (saved) {
      setSavedTranscript(saved);
      setStatusText("Transcript saved.");
      toast({ title: "Transcript saved", description: "Transcripts are immutable; a new recording creates a new one." });
    }
  }

  async function uploadFallback(file: File) {
    setFallbackUploading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("audio", file);
      form.append("language", (LANGUAGES.find((item) => item.value === language)?.entry ?? "en") + "-" + "US");
      const response = await fetch("/api/v1/voice/transcribe", {
        method: "POST",
        credentials: "include",
        body: form
      });
      const payload = (await response.json().catch(() => null)) as
        | { data: { text: string } }
        | { error: { message: string; code: string } }
        | null;
      if (!response.ok || !payload || !("data" in payload)) {
        const message =
          payload && "error" in payload ? payload.error.message : "Server transcription is unavailable.";
        setError(message);
        return;
      }
      setFallbackText(payload.data.text);
      setTranscript(payload.data.text);
      setPhase("review");
      setStatusText("Audio transcribed on the server. Review before saving.");
    } catch {
      setError("The upload failed. You can still type this entry.");
    } finally {
      setFallbackUploading(false);
    }
  }

  const recording = phase === "recording" || phase === "starting";
  const statusLabel = recording ? "Recording" : phase === "review" ? "Review" : "Ready";

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-muted">Voice journal</p>
          <h1 className="mt-1 font-serif text-2xl leading-tight text-ink sm:text-3xl">Say it, then shape it.</h1>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-soft">
            Speak in your own language. Your browser writes the transcript, you correct it, and only then
            does it become an entry.
          </p>
        </div>
        <Link href="/journal/new" className={buttonStyles("secondary", "sm")}>
          <Keyboard aria-hidden="true" className="size-3.5" />
          Type instead
        </Link>
      </header>

      <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader className="items-center">
            <CardTitle>Record</CardTitle>
            <Badge tone={recording ? "danger" : phase === "review" ? "success" : "neutral"}>{statusLabel}</Badge>
          </CardHeader>
          <CardContent className="space-y-5 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <Field label="Spoken language" htmlFor="voice-language" className="w-full sm:w-56">
                {({ id }) => (
                  <Select
                    id={id}
                    value={language}
                    onChange={(event) => setLanguage(event.target.value)}
                    disabled={recording}
                  >
                    {LANGUAGES.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </Select>
                )}
              </Field>

              <div className="ml-auto flex items-center gap-3">
                <div className="text-right">
                  <p className="font-mono text-lg leading-none text-ink">
                    {String(Math.floor(elapsed / 60)).padStart(2, "0")}:
                    {String(elapsed % 60).padStart(2, "0")}
                  </p>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wide text-ink-muted">elapsed</p>
                </div>
                {recording ? (
                  <Button variant="danger" size="lg" onClick={stopRecording} aria-label="Stop recording">
                    <Square aria-hidden="true" className="size-4" />
                    Stop
                  </Button>
                ) : (
                  <Button size="lg" onClick={() => void startRecording()} disabled={supported === false}>
                    <Mic aria-hidden="true" className="size-4" />
                    Start recording
                  </Button>
                )}
              </div>
            </div>

            <div className="relative h-28 overflow-hidden rounded-md border border-border bg-subtle/60">
              <Waveform analyser={analyser} active={recording} className="h-full w-full px-3" />
              {!recording && phase !== "review" ? (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <p className="rounded-full bg-surface/90 px-3 py-1 text-[11px] text-ink-muted shadow-raised">
                    {supported === false ? "Live waveform unavailable in this browser" : "The waveform moves with your voice"}
                  </p>
                </div>
              ) : null}
            </div>

            <p role="status" aria-live="polite" className="text-xs text-ink-soft">
              {statusText}
            </p>

            {error ? (
              <div role="alert" className="flex gap-2 rounded-sm border border-warning/40 bg-warning-soft px-3 py-2.5 text-xs leading-relaxed text-ink">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-3.5 shrink-0 text-warning" />
                <span>{error}</span>
              </div>
            ) : null}

            {supported === false ? (
              <div className="space-y-3 rounded-sm border border-border bg-canvas p-4">
                <div className="flex gap-2 text-sm leading-relaxed text-ink-soft">
                  <MicOff aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-muted" />
                  <p>
                    This browser doesn&apos;t expose live speech recognition. You can type the entry, or try
                    an audio file with the server fallback below.
                  </p>
                </div>
                <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-accent">
                  <Upload aria-hidden="true" className="size-3.5" />
                  {fallbackUploading ? "Transcribing…" : "Upload an audio file"}
                  <input
                    type="file"
                    accept="audio/*"
                    className="sr-only"
                    disabled={fallbackUploading}
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadFallback(file);
                    }}
                  />
                </label>
                {fallbackText ? (
                  <p className="text-xs text-ink-muted">Server transcript loaded below.</p>
                ) : null}
              </div>
            ) : null}

            {phase === "review" || transcript ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label htmlFor="transcript" className="text-sm font-medium text-ink">
                    Transcript
                  </label>
                  <span className="text-[11px] text-ink-muted">
                    {transcript.trim().split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
                <Textarea
                  id="transcript"
                  value={transcript}
                  rows={7}
                  onChange={(event) => setTranscript(event.target.value)}
                  placeholder="Your spoken words appear here."
                  className="min-h-40 bg-canvas leading-relaxed"
                />
                {interim ? (
                  <p className="text-xs italic text-ink-muted">Listening: {interim}</p>
                ) : null}
                <p className="text-[11px] leading-relaxed text-ink-muted">
                  Correct names and numbers now. Saving creates an immutable transcript record, just like
                  your original text.
                </p>

                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    loading={createEntry.isPending}
                    disabled={!transcript.trim()}
                    onClick={() => createEntry.mutate()}
                  >
                    <CheckCircle2 aria-hidden="true" className="size-4" />
                    Save as journal entry
                  </Button>
                  <Button
                    variant="secondary"
                    loading={saveTranscript.isPending}
                    disabled={!transcript.trim() || Boolean(savedTranscript)}
                    onClick={() => void keepTranscript()}
                  >
                    Keep transcript only
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setTranscript("");
                      setInterim("");
                      setElapsed(0);
                      setPhase("idle");
                      setSavedTranscript(null);
                      setError(null);
                      setStatusText("Ready to record.");
                    }}
                  >
                    Start over
                  </Button>
                </div>

                {savedTranscript ? (
                  <p className="flex items-center gap-1.5 text-xs text-success">
                    <CheckCircle2 aria-hidden="true" className="size-3.5" />
                    Transcript saved on its own.{" "}
                    <Link href="/journal" className="underline underline-offset-4">
                      Open journal
                    </Link>
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>How this works</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ol className="space-y-3">
                {[
                  "Record in English, Urdu or Hindi.",
                  "Your browser produces the transcript locally.",
                  "Correct the text before anything is stored.",
                  "Saving keeps the transcript separate from the entry.",
                  "The assistant can structure it — only after you approve."
                ].map((step, index) => (
                  <li key={step} className="flex gap-2.5 text-sm leading-relaxed text-ink-soft">
                    <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-border bg-canvas text-[10px] font-semibold text-ink-muted">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>

          {supported === false ? (
            <EmptyState
              compact
              icon={Keyboard}
              title="Typing always works"
              description="You can write the same entry by hand and still add a mood, questions and an AI draft."
              action={
                <Link href="/journal/new" className={buttonStyles("secondary", "sm")}>
                  Open the editor
                </Link>
              }
            />
          ) : null}

          <div className={cn("rounded-md border border-border bg-subtle/60 p-4")}>
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-muted">
              <ShieldCheck aria-hidden="true" className="size-3.5" />
              Privacy
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-ink-soft">
              The recording itself is not uploaded. Only the corrected transcript is stored, scoped to your
              account. Audio stays in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
