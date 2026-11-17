import { z } from "zod";
import { loadEnvironment } from "./load-env.js";

loadEnvironment();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  API_PORT: z.coerce.number().int().min(1).max(65535).default(3001),

  APP_URL: z.url().default("http://localhost:3000"),
  API_INTERNAL_URL: z.url().default("http://localhost:3001"),

  DATABASE_URL: z
    .string()
    .min(1, "DATABASE_URL is required. Use the Neon pooled connection string."),

  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET must be at least 32 characters. Generate one with `openssl rand -base64 32`."),
  BETTER_AUTH_URL: z.url().default("http://localhost:3000"),
  BETTER_AUTH_TRUSTED_ORIGINS: z.string().default("http://localhost:3000"),

  LLM_PROVIDER: z.string().default("openai-compatible"),
  LLM_BASE_URL: z.string().optional(),
  LLM_API_KEY: z.string().optional(),
  LLM_MODEL: z.string().optional(),
  LLM_MAX_INPUT_TOKENS: z.coerce.number().int().min(500).max(200_000).default(16_000),
  LLM_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(180_000).default(60_000),
  PROMPT_VERSION: z.string().default("v1"),

  STT_PROVIDER: z.string().optional(),
  STT_API_KEY: z.string().optional(),
  STT_DEFAULT_LANGUAGE: z.string().default("en-US"),

  CRON_SECRET: z.string().optional(),
  REMINDER_CHANNEL: z.enum(["browser", "in_app"]).default("browser"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info")
});

export type Env = z.infer<typeof envSchema> & {
  /** Parsed comma-separated list of trusted origins. */
  trustedOrigins: string[];
};

function parseEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    const banner = [
      "",
      "AI Journal API cannot start — environment validation failed.",
      "Copy .env.example to .env and fill in the missing values.",
      "",
      details,
      ""
    ].join("\n");
    // Intentional: fail fast at boot, never at the first request (T0.3).
    console.error(banner);
    throw new Error("Invalid environment configuration");
  }

  const trustedOrigins = parsed.data.BETTER_AUTH_TRUSTED_ORIGINS.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return { ...parsed.data, trustedOrigins };
}

export const env = parseEnv();

export const isProduction = env.NODE_ENV === "production";
