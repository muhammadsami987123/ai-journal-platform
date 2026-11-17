import { defineConfig } from "eslint/config";
import base from "@journal/config/eslint";

export default defineConfig([
  ...base,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@journal/database", "@journal/database/*"],
              message: "The web app must never touch the database. Use lib/api."
            }
          ]
        }
      ]
    }
  }
]);
