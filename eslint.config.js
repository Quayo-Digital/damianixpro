import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "dist",
      "coverage",
      "node_modules",
      "**/agent-tools/**",
      "**/*.test.mjs",
      "fintech-api/node_modules/**",
      "fintech-api/examples/**",
      "fintech-api/qa/**",
    ],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-unused-vars": "off",
      // Prevent console.log usage - use logger utility instead
      "no-console": ["warn", { 
        allow: ["warn", "error"] // Allow console.warn and console.error for critical errors
      }],
      // Enforce consistent code style
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/explicit-function-return-type": "off", // Too strict for React
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
  {
    files: ["src/components/ui/**/*.{ts,tsx}"],
    rules: {
      // shadcn/ui files export both components and `*Variants` helpers from `cva`
      "react-refresh/only-export-components": "off",
    },
  },
  {
    files: [
      "server/**/*.mjs",
      "scripts/**/*.{js,mjs}",
      "fintech-api/**/*.js",
      "fix-app-issues.js",
      "configure-nigerian-apis.js",
    ],
    extends: [js.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "no-console": "off",
      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
    },
  }
);
