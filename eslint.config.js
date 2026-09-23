// https://docs.expo.dev/guides/using-eslint/
const pluginQuery = require("@tanstack/eslint-plugin-query")
const typescriptPlugin = require("@typescript-eslint/eslint-plugin")
const { defineConfig, globalIgnores } = require("eslint/config")
const expoConfig = require("eslint-config-expo/flat")
const importPlugin = require("eslint-plugin-import")
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended")
const pluginReactNative = require("eslint-plugin-react-native")

module.exports = defineConfig([
  globalIgnores([
    ".expo/*",
    "dist/*",
    "babel.config.js",
    "metro.config.js",
    "expo-env.d.ts",
    "src/uniwind-types.d.ts",
    "**/*.test.ts",
    "e2e/reports/*",
  ]),
  expoConfig,
  eslintPluginPrettierRecommended,
  importPlugin.flatConfigs.recommended,
  ...pluginQuery.configs[ "flat/recommended" ],
  {
    plugins: {
      "react-native": pluginReactNative,
      "@typescript-eslint": typescriptPlugin,
    },
    rules: {
      "no-console": "error",
      "react-native/no-inline-styles": "error",
      "react-native/no-color-literals": "error",
      "react-native/split-platform-components": "error",
      "react-native/no-unused-styles": "error",
      "react-native/no-single-element-style-arrays": "error",

      // Allow default imports from specific packages
      "import/no-default-export": "off",
      "import/default": "off",
      "import/no-named-as-default": "off",
      "import/no-named-as-default-member": "off",
      "import/order": [
        "error",
        {
          groups: [
            [ "builtin", "external" ],
            "internal",
            [ "parent", "sibling", "index" ],
          ],
          pathGroups: [
            {
              pattern: "{react,react-native}",
              group: "builtin",
              position: "before",
            },
            {
              pattern: "**/*.css",
              group: "external",
              position: "before",
              patternOptions: {
                matchBase: true,
              },
            },
            {
              pattern: "@/**",
              group: "internal",
            },
            {
              pattern: "../**",
              group: "parent",
            },
            {
              pattern: "./**",
              group: "sibling",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: [ "react", "react-native" ],
          // Side-effect CSS imports (e.g. ../global.css) cannot be reordered by
          // --fix when sandwiched between bound imports; allow intra-group
          // newlines so save-time ESLint fixes still apply elsewhere.
          "newlines-between": "always-and-inside-groups",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],

      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
          ignoreRestSiblings: true,
          args: "all",
        },
      ],
    },
  },
  // La suite E2E: su propio tsconfig, y la consola ES su canal de reporte.
  {
    files: [ "e2e/**/*.ts" ],
    languageOptions: {
      parserOptions: {
        project: [ "./e2e/tsconfig.json" ],
      },
    },
    rules: {
      "no-console": "off",
    },
  },
  // Scripts de build y utilidades: ESM de Node, no código de la app.
  {
    files: [ "scripts/**/*.mjs" ],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-console": "off",
      "import/no-unresolved": "off",
    },
  },
  // TypeScript-specific config that only applies to TS files
  {
    files: [ "**/*.ts", "**/*.tsx" ],
    plugins: {
      "@typescript-eslint": typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptPlugin.parser,
      parserOptions: {
        ecmaVersion: 2022,
        sourceType: "module",
        project: [ "./tsconfig.json" ],
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    rules: {
      // Enforce using 'import type' for type imports in the same line
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: true,
          fixStyle: "inline-type-imports",
        },
      ],
    },
  },
])
