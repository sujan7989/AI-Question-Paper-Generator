import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
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
      // Unused vars — off (handled by TS compiler)
      "@typescript-eslint/no-unused-vars": "off",
      // Allow explicit any in specific cases (Supabase responses, PDF.js items, catch blocks)
      "@typescript-eslint/no-explicit-any": "warn",
      // Allow empty interfaces (used by shadcn/ui generated components)
      "@typescript-eslint/no-empty-object-type": "off",
      // Allow require() in config files
      "@typescript-eslint/no-require-imports": "off",
      // Allow empty catch blocks (used for silent fallbacks in AI providers)
      "no-empty": ["error", { "allowEmptyCatch": true }],
      // Allow control chars in regex (used in PDF text sanitization)
      "no-control-regex": "off",
      // Useless escapes — warn only, not error
      "no-useless-escape": "warn",
      // prefer-const — warn only
      "prefer-const": "warn",
      // Useless catch — warn only
      "no-useless-catch": "warn",
    },
  }
);
