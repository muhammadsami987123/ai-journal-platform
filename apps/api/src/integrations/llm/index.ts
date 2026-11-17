import { env } from "../../config/env.js";
import { buildJournalPrompt, buildRepairPrompt, PROMPT_VERSION, renderJournalMarkdown } from "./prompts.js";
import { createLlmClient, LlmUnavailableError, type LlmClient } from "./client.js";
import { aiJournalOutputSchema, type AiJournalOutput } from "@journal/shared";
import { AppException } from "../../common/errors/app.exception.js";

export { PROMPT_VERSION, buildJournalPrompt, buildRepairPrompt } from "./prompts.js";
export type { PromptMessage } from "./prompts.js";

const client: LlmClient = createLlmClient({
  provider: env.LLM_PROVIDER,
  baseUrl: env.LLM_BASE_URL,
  apiKey: env.LLM_API_KEY,
  model: env.LLM_MODEL,
  timeoutMs: env.LLM_TIMEOUT_MS
});

export interface GenerateResult {
  output: AiJournalOutput;
  markdown: string;
  model: string;
  provider: string;
  promptVersion: string;
  tokensIn: number | null;
  tokensOut: number | null;
}

function parseJson(raw: string): unknown {
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}

/**
 * Two calls maximum: the first generation and (only on invalid output) one
 * repair attempt. Nothing invalid is ever returned or persisted (T8.2).
 */
export async function generateStructuredJournal(input: {
  sourceText: string;
  outputLanguage: "match" | string;
  instruction?: string;
}): Promise<GenerateResult> {
  if (!client.configured) {
    throw new AppException(
      "AI_UNAVAILABLE",
      "The writing assistant is not configured yet.",
      503
    );
  }

  const messages = buildJournalPrompt(input);
  let completion;
  try {
    completion = await client.complete(messages);
  } catch (error) {
    if (error instanceof LlmUnavailableError) {
      throw new AppException(
        "AI_UNAVAILABLE",
        "The writing assistant is temporarily unavailable. Your draft is safe.",
        503
      );
    }
    throw error;
  }

  const firstAttempt = aiJournalOutputSchema.safeParse(safeParse(completion.raw));
  if (firstAttempt.success) {
    return buildResult(firstAttempt.data, completion);
  }

  const issues = firstAttempt.error.issues.map(
    (issue) => `${issue.path.join(".") || "root"}: ${issue.message}`
  );

  let repair;
  try {
    repair = await client.complete(
      buildRepairPrompt(completion.raw, issues, input.outputLanguage === "match" ? "source" : input.outputLanguage)
    );
  } catch {
    throw new AppException(
      "AI_INVALID_OUTPUT",
      "The assistant could not produce a valid draft. Try again.",
      502
    );
  }

  const secondAttempt = aiJournalOutputSchema.safeParse(safeParse(repair.raw));
  if (!secondAttempt.success) {
    throw new AppException(
      "AI_INVALID_OUTPUT",
      "The assistant could not produce a valid draft. Try again.",
      502
    );
  }

  return buildResult(secondAttempt.data, repair);
}

function safeParse(raw: string): unknown {
  try {
    return parseJson(raw);
  } catch {
    return null;
  }
}

function buildResult(
  output: AiJournalOutput,
  completion: { model: string; provider: string; tokensIn: number | null; tokensOut: number | null }
): GenerateResult {
  return {
    output,
    markdown: renderJournalMarkdown(output),
    model: completion.model,
    provider: completion.provider,
    promptVersion: PROMPT_VERSION,
    tokensIn: completion.tokensIn,
    tokensOut: completion.tokensOut
  };
}
