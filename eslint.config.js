import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

// eslint-config-next ships flat configs directly. Going through
// @eslint/eslintrc's FlatCompat instead throws on ESLint 10, because its config
// validator JSON.stringifies a plugin object that references itself.
const config = [
  {
    ignores: ['.next/**', 'dist/**', 'dist-vps/**', 'node_modules/**', 'next-env.d.ts', 'content/**'],
  },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // The portal links out to OJS, which nginx serves on another path prefix.
      // A plain <a> is correct there and must not be rewritten to next/link.
      '@next/next/no-html-link-for-pages': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },
]

export default config
