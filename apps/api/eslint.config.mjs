import { defineConfig } from "eslint/config";
import base from "@journal/config/eslint";

export default defineConfig([
  ...base,
  {
    files: ["src/**/*.ts"],
    rules: {
      // NestJS decorators rely on empty constructors and parameter properties.
      "@typescript-eslint/no-extraneous-class": "off"
    }
  }
]);
