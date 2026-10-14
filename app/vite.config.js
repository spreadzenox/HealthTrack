import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const pkg = JSON.parse(readFileSync(resolve(__dirname, 'package.json'), 'utf-8'))
const appVersion = process.env.VITE_APP_VERSION ?? pkg.version ?? '0.0.0'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  // Gros JSON (table Ciqual) émis en `JSON.parse("…")`, bien plus rapide à évaluer qu'un littéral
  json: { stringify: true },
  // Worker d'analyse en module ES (créé avec `type: 'module'`) : il charge la table Ciqual à la demande
  worker: { format: 'es' },
  server: {},
})
