import { defineConfig } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals.js";
import nextTs from "eslint-config-next/typescript.js";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  { ignores: [".next/**", "node_modules/**"] },
]);
