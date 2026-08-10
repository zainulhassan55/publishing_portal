import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/publishing_portal/',
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'spa-github-pages-fallback',
      closeBundle() {
        const indexHtml = resolve(import.meta.dirname, 'dist/index.html')
        const notFoundHtml = resolve(import.meta.dirname, 'dist/404.html')
        copyFileSync(indexHtml, notFoundHtml)
      },
    },
  ],
})
