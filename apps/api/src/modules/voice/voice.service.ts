import { Injectable, Logger } from "@nestjs/common";
import type { Transcript, TranscriptionCreateInput } from "@journal/shared";
import { env } from "../../config/env.js";
import { AppException } from "../../common/errors/app.exception.js";
import { TranscriptionsRepository } from "./transcriptions.repository.js";

const WINDOW_MS = 60_000;
const MAX_STT_PER_WINDOW = 6;

@Injectable()
export class VoiceService {
  private readonly logger = new Logger("VoiceService");
  private readonly attempts = new Map<string, number[]>();

  constructor(private readonly transcriptions: TranscriptionsRepository) {}

  saveTranscript(userId: string, input: TranscriptionCreateInput): Promise<Transcript> {
    return this.transcriptions.create(userId, input);
  }

  getTranscript(userId: string, id: string): Promise<Transcript> {
    return this.transcriptions.findById(userId, id);
  }

  async linkTranscript(userId: string, transcriptId: string, entryId: string): Promise<void> {
    await this.transcriptions.linkToEntry(userId, transcriptId, entryId);
  }

  /**
   * Server fallback only (D4). Browser SpeechRecognition is the primary path;
   * when no provider is configured the endpoint answers 503 so the client can
   * fall back to typing without breaking the flow.
   */
  async transcribeAudio(
    userId: string,
    file: { buffer: Buffer; mimetype: string; originalname: string; size: number } | undefined,
    language: string
  ): Promise<{ text: string; provider: "server" }> {
    if (!this.configured()) {
      throw new AppException(
        "STT_UNAVAILABLE",
        "Server transcription is not configured. You can still type your entry.",
        503
      );
    }

    if (!file || file.size === 0) {
      throw new AppException("VALIDATION_FAILED", "Attach an audio recording.", 400);
    }

    const now = Date.now();
    const recent = (this.attempts.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);
    if (recent.length >= MAX_STT_PER_WINDOW) {
      throw new AppException(
        "RATE_LIMITED",
        "Too many transcription requests. Try again in a minute.",
        429
      );
    }
    recent.push(now);
    this.attempts.set(userId, recent);

    const form = new FormData();
    form.append("file", new Blob([new Uint8Array(file.buffer)], { type: file.mimetype }), file.originalname);
    form.append("model", env.STT_PROVIDER ?? "whisper-1");
    form.append("language", language);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.LLM_TIMEOUT_MS);

    try {
      const response = await fetch(`${(env.LLM_BASE_URL ?? "").replace(/\/$/, "")}/audio/transcriptions`, {
        method: "POST",
        headers: { authorization: `Bearer ${env.STT_API_KEY ?? ""}` },
        body: form,
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error(`STT provider responded ${response.status}`);
      }

      const payload = (await response.json()) as { text?: string };
      if (!payload.text?.trim()) {
        throw new Error("Empty transcription");
      }

      return { text: payload.text, provider: "server" };
    } catch (error) {
      this.logger.error(
        `Server transcription failed: ${error instanceof Error ? error.message : "unknown"}`
      );
      throw new AppException(
        "STT_UNAVAILABLE",
        "Server transcription is unavailable. You can still type your entry.",
        503
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private configured(): boolean {
    return Boolean(env.STT_PROVIDER && env.STT_API_KEY && env.LLM_BASE_URL);
  }
}
