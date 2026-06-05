import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),

  {
    // No raw Prisma client outside the allowed locations
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@prisma/client"],
              message:
                "Do not import PrismaClient directly. Use the singleton in lib/db/prisma.ts or repository functions in lib/db/repositories/*.",
            },
          ],
        },
      ],
    },
    ignores: [
      "lib/db/prisma.ts",
      "lib/db/repositories/**",
      "lib/outbox/**",
      "lib/email/**",
      "lib/badges/**",
      "lib/auth/**",
      "lib/cron/**",
      "scripts/**",
      "prisma/**",
    ],
  },

  {
    // Ban raw hex colour literals in component files and globals.css
    // (design-tokens.css is the one place raw hex IS allowed)
    files: ["components/**/*.{ts,tsx}", "styles/globals.css", "app/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            "Literal[value=/^#[0-9A-Fa-f]{3,8}$/]",
          message:
            "Raw hex colours are forbidden in component files. Use CSS custom properties (var(--token-name)) or Tailwind token classes instead.",
        },
      ],
    },
  },
];

export default eslintConfig;
