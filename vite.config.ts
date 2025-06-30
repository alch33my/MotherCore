import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron'
import renderer from 'vite-plugin-electron-renderer'
import path from 'path'
import fs from 'fs'

// Copy preload script to dist-electron/preload
const copyPreloadScript = () => {
  if (!fs.existsSync('dist-electron/preload')) {
    fs.mkdirSync('dist-electron/preload', { recursive: true })
  }
  fs.copyFileSync('src/preload/preload.js', 'dist-electron/preload/preload.js')
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    electron([
      {
        // Main process
        entry: 'src/main/main.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              external: ['electron', 'better-sqlite3', 'bcryptjs']
            }
          }
        },
        onstart: () => {
          copyPreloadScript()
        }
      }
    ]),
    renderer()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'
          }
        }
      }
    }
  }
})
