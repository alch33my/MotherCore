import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import renderer from 'vite-plugin-electron-renderer';
import svgr from 'vite-plugin-svgr';
import path from 'path';
// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        react(),
        svgr({
            svgrOptions: {
                icon: true,
                exportType: 'named',
                ref: true,
            },
            include: '**/*.svg',
        }),
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
                }
            },
            {
                // Preload process
                entry: 'src/preload/preload.js',
                vite: {
                    build: {
                        outDir: 'dist-electron/preload',
                        rollupOptions: {
                            external: ['electron']
                        }
                    }
                }
            }
        ]),
        renderer()
    ],
    server: {
        host: '127.0.0.1',
        port: 7777
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            '@images': path.resolve(__dirname, 'Images')
        },
        extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    }
});
