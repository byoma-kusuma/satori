import globals from 'globals'
import js from '@eslint/js'
import pluginQuery from '@tanstack/eslint-plugin-query'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'src/components/ui'] },
  {
    extends: [
      js.configs.recommended,
      ...tseslint.configs.recommended,
      ...pluginQuery.configs['flat/recommended'],
    ],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-restricted-types': [
        'error',
        {
          types: {
            unknown: {
              message:
                'Avoid `unknown` in application code. Prefer precise types, narrowing helpers, or schema validation at trust boundaries.',
            },
          },
        },
      ],
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      'no-console': 'error',
    },
  }
)
