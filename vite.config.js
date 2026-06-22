import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  base: '/MidwestMesoProj/', // <-- Tells GitHub Pages exactly where your repository lives
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './') // <-- Changed from './src' to './' since your files are in the root
    }
  }
})
