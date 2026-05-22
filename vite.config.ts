/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { apiProxyPlugin } from './vite-plugins/api-proxy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      react(),
      apiProxyPlugin({
        GOOGLE_AI_API_KEY: loaded.GOOGLE_AI_API_KEY ?? loaded.VITE_GOOGLE_AI_API_KEY,
        VITE_FIREBASE_API_KEY: loaded.VITE_FIREBASE_API_KEY,
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:5000',
          changeOrigin: true,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      env: {
        VITE_FIREBASE_API_KEY: 'vitest-placeholder-firebase-key',
        VITE_FIREBASE_AUTH_DOMAIN: 'vitest-placeholder.firebaseapp.com',
        VITE_FIREBASE_PROJECT_ID: 'vitest-placeholder',
        VITE_FIREBASE_STORAGE_BUCKET: 'vitest-placeholder.appspot.com',
        VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
        VITE_FIREBASE_APP_ID: '1:000000000000:web:vitest-placeholder',
      },
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        exclude: [
          'node_modules/',
          'src/test/',
          '**/*.d.ts',
          '**/*.config.*',
          'src/main.tsx',
        ],
        thresholds: {
          statements: 70,
          branches: 70,
          functions: 70,
          lines: 70,
        },
      },
    },
  };
});
