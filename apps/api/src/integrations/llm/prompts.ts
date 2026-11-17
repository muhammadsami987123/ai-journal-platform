import type { AiJournalOutput } from "@journal/shared";

export interface PromptMessage {
  role: "system" | "user";
  content: string;
}

export interface PromptInput {
  sourceText: string;
  outputLanguage: "match" | string;
  instruction?: string;
}

/** Versioned prompt — bump PROMPT_VERSION whenever this file changes. */
export const PROMPT_VERSION = "v1";

const SYSTEM_PROMPT = `You organise a person's own journal writing into a structured summary.

NON-NEGOTIABLE RULES
1. Use only information explicitly present in the source text.
2. Never invent events, people, places, feelings, causes, numbers or conclusions.
3. Keep the writer's voice, tone and register. Do not formalise casual writing; do not dramatise neutral events.
4. Keep names, products, places and numbers exactly as written.
5. Write the output in the source language unless a different output language is requested. Romanised text stays romanised unless translation is requested.
6. Return the fixed JSON object only — no prose, no markdown fences.
7. If the source is too short to fill a section, return an empty array. Never add filler to look complete.
8. Do not moralise, advise, motivate or add commentary.
9. Reflecting is allowed only by rephrasing what the writer already expressed.

JSON CONTRACT (all keys required)
{
  "overview": "one short paragraph in the writer's voice",
  "activities": ["things the writer did"],
  "achievements": ["things the writer completed or is proud of"],
  "challenges": ["difficulties the writer mentioned"],
  "lessons": ["what the writer says they learned"],
  "reflections": ["the writer's own reflections, rephrased faithfully"],
  "tomorrow_goals": ["plans the writer states for tomorrow or later"],
  "language": "BCP-47 style code of the output, e.g. en, ur, hi"
}`;

export function buildJournalPrompt(input: PromptInput): PromptMessage[] {
  const languageRule =
    input.outputLanguage === "match"
      ? "Output language: match the source language exactly."
      : `Output language: ${input.outputLanguage}. Translate faithfully; do not add or remove meaning.`;

  const parts = [
    languageRule,
    input.instruction ? `Additional instruction from the writer: ${input.instruction}` : "",
    "",
    "SOURCE TEXT (verbatim, between the markers):",
    "<<<SOURCE",
    input.sourceText,
    "SOURCE>>>"
  ].filter(Boolean);

  return [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: parts.join("\n") }
  ];
}

export function buildRepairPrompt(
  previousRaw: string,
  issues: string[],
  language: string
): PromptMessage[] {
  return [
    {
      role: "system",
      content: `You fix JSON that failed schema validation. Return only a corrected JSON object with exactly these keys: overview, activities, achievements, challenges, lessons, reflections, tomorrow_goals, language. Arrays may be empty. Keep the same content and language (${language}). RULES: never invent facts, never add filler.`
    },
    {
      role: "user",
      content: `Validation errors:\n- ${issues.join("\n- ")}\n\nINVALID OUTPUT:\n${previousRaw}`
    }
  ];
}

/** Rendered from the validated JSON so display and storage cannot diverge. */
export function renderJournalMarkdown(output: AiJournalOutput): string {
  const sections: string[] = [];

  if (output.overview.trim()) {
    sections.push(`### Daily Overview\n\n${output.overview.trim()}`);
  }

  const lists: { title: string; items: string[] }[] = [
    { title: "Activities", items: output.activities },
    { title: "Achievements", items: output.achievements },
    { title: "Challenges", items: output.challenges },
    { title: "Lessons Learned", items: output.lessons },
    { title: "Personal Reflections", items: output.reflections },
    { title: "Tomorrow's Goals", items: output.tomorrow_goals }
  ];

  for (const list of lists) {
    const items = list.items.map((item) => item.trim()).filter(Boolean);
    if (items.length === 0) continue;
    sections.push(`### ${list.title}\n\n${items.map((item) => `- ${item}`).join("\n")}`);
  }

  return sections.join("\n\n");
}
