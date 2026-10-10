import { defineConfig, globalIgnores } from "eslint/config";
import next from "eslint-config-next/core-web-vitals";
import ts from "eslint-config-next/typescript";
export default defineConfig([
  ...next,
  ...ts,
  globalIgnores([
    ".next/**",
    ".tools/**",
    "playwright-report/**",
    "test-results/**",
    "evidencias/**",
    "scripts/**",
    "analise-referencia/**",
    "direcao-visual/**",
  ]),
  {
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/refs": "off",
      "@next/next/no-img-element": "off",
    },
  },
  {
    files: ["src/components/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
]);
