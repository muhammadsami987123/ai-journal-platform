import { Injectable, Logger } from "@nestjs/common";
import { LIMITS, type AiGenerateInput, type AiGeneration, type AiApproveInput } from "@journal/shared";
import { env } from "../../config/env.js";
import { AppException } from "../../common/errors/app.exception.js";
import { generateStructuredJournal } from "../../integrations/llm/index.js";
import { EntriesRepository } from "../journals/entries.repository.js";
import { TranscriptionsRepository } from "../voice/transcriptions.repository.js";
import { AiRepository } from "./ai.repository.js";

/** Per-user sliding window; deliberately in-process (single API instance in v1). */
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 6;

@Injectable()
export class AiService {
  private readonly logger = new Logger("AiService");
  private readonly inFlight = new Set<string>();
  private readonly attempts = new Map<string, number[]>();

  constructor(
    private readonly repository: AiRepository,
    private readonly entries: EntriesRepository,
    private readonly transcriptions: TranscriptionsRepository
  ) {}

  /** One in-flight generation per entry + per-user rate limit (T8.6). */
  private enter(userId: string, entryId: string): void {
    const now = Date.now();
    const recent = (this.attempts.get(userId) ?? []).filter((time) => now - time < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
      throw new AppException(
        "AI_RATE_LIMITED",
        "You have asked for several drafts in a minute. Try again shortly.",
        429
      );
    }
    const key = `${userId}:${entryId}`;
    if (this.inFlight.has(key)) {
      throw new AppException(
        "AI_RATE_LIMITED",
        "A draft is already being written for this entry.",
        429
      );
    }
    recent.push(now);
    this.attempts.set(userId, recent);
    this.inFlight.add(key);
  }

  private exit(userId: string, entryId: string): void {
    this.inFlight.delete(`${userId}:${entryId}`);
  }

  private assertInputSize(text: string): void {
    if (text.length > LIMITS.MAX_AI_INPUT_CHARS) {
      throw new AppException(
        "ENTRY_TOO_LONG",
        `The writing assistant accepts up to ${LIMITS.MAX_AI_INPUT_CHARS.toLocaleString()} characters at a time.`,
        422
      );
    }
    const estimatedTokens = Math.ceil(text.length / 4);
    if (estimatedTokens > env.LLM_MAX_INPUT_TOKENS) {
      throw new AppException(
        "ENTRY_TOO_LONG",
        "This entry is too long for one draft. Split it and try again.",
        422
      );
    }
  }

  async generate(userId: string, input: AiGenerateInput): Promise<AiGeneration> {
    const entry = await this.entries.findById(userId, input.entry_id);

    let sourceText: string;
    let sourceRefId: string | null = null;

    if (input.source_type === "transcription") {
      if (!input.source_ref_id) {
        throw new AppException(
          "VALIDATION_FAILED",
          "Choose the transcript you want organised.",
          400
        );
      }
      const transcript = await this.transcriptions.findById(userId, input.source_ref_id);
      sourceText = transcript.text;
      sourceRefId = transcript.id;
    } else {
      sourceText = input.source_text ?? entry.original_text ?? entry.final_text;
      if (!sourceText.trim()) {
        throw new AppException("VALIDATION_FAILED", "Write something first.", 400);
      }
    }

    this.assertInputSize(sourceText);
    this.enter(userId, entry.id);

    try {
      const result = await generateStructuredJournal({
        sourceText,
        outputLanguage: input.output_language
      });

      return await this.repository.insert({
        userId,
        entryId: entry.id,
        sourceType: input.source_type,
        sourceRefId,
        outputJson: result.output,
        outputMarkdown: result.markdown,
        language: result.output.language,
        isTranslation:
          input.output_language !== "match" &&
          result.output.language.slice(0, 2) !== (entry.language ?? "").slice(0, 2),
        model: result.model,
        provider: result.provider,
        promptVersion: result.promptVersion,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut
      });
    } catch (error) {
      if (error instanceof AppException) throw error;
      this.logger.error(`Generation failed [${userId}]: ${error instanceof Error ? error.message : "unknown"}`);
      throw new AppException(
        "AI_UNAVAILABLE",
        "The writing assistant is temporarily unavailable. Your draft is safe.",
        503
      );
    } finally {
      this.exit(userId, entry.id);
    }
  }

  async regenerate(
    userId: string,
    generationId: string,
    input: { instruction?: string; output_language?: "match" | string }
  ): Promise<AiGeneration> {
    const existing = await this.repository.requireOwned(userId, generationId);
    if (!existing.entryId) {
      throw new AppException("VALIDATION_FAILED", "This draft is not attached to an entry.", 422);
    }

    const entry = await this.entries.findById(userId, existing.entryId);
    let sourceText: string;

    if (existing.sourceType === "transcription" && existing.sourceRefId) {
      const transcript = await this.transcriptions.findById(userId, existing.sourceRefId);
      sourceText = transcript.text;
    } else {
      sourceText = entry.original_text || entry.final_text;
    }

    if (!sourceText.trim()) {
      throw new AppException("VALIDATION_FAILED", "There is no source text to regenerate from.", 422);
    }

    this.assertInputSize(sourceText);
    this.enter(userId, entry.id);

    try {
      const result = await generateStructuredJournal({
        sourceText,
        outputLanguage: input.output_language ?? "match",
        instruction: input.instruction
      });

      return await this.repository.insert({
        userId,
        entryId: entry.id,
        sourceType: existing.sourceType === "transcription" ? "transcription" : "text",
        sourceRefId: existing.sourceRefId,
        outputJson: result.output,
        outputMarkdown: result.markdown,
        language: result.output.language,
        isTranslation: Boolean(input.output_language && input.output_language !== "match"),
        model: result.model,
        provider: result.provider,
        promptVersion: result.promptVersion,
        tokensIn: result.tokensIn,
        tokensOut: result.tokensOut
      });
    } catch (error) {
      if (error instanceof AppException) throw error;
      throw new AppException(
        "AI_UNAVAILABLE",
        "The writing assistant is temporarily unavailable. Your draft is safe.",
        503
      );
    } finally {
      this.exit(userId, entry.id);
    }
  }

  async approve(
    userId: string,
    generationId: string,
    input: AiApproveInput
  ): Promise<AiGeneration> {
    return this.repository.approve(userId, generationId, input.edited_markdown);
  }

  async list(userId: string, entryId: string): Promise<AiGeneration[]> {
    await this.entries.verifyEntryOwnership(userId, entryId);
    return this.repository.listByEntry(userId, entryId);
  }
}
