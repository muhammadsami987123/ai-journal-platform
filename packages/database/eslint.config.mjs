import { defineConfig } from "eslint/config";
import base from "@journal/config/eslint";

export default defineConfig([
  ...base,
  {
    ignores: ["drizzle.config.ts"]
  }
]);
