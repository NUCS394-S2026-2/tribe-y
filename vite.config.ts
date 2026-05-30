/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

import { apiProxyPlugin } from './vite-plugins/api-proxy';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const loaded = loadEnv(mode, process.cwd(), '');

  // Firebase Hosting emulator port. Defaults to 5000, but macOS often
  // squats on 5000 with AirPlay Receiver (returns 403 to most traffic),
  // forcing the emulator to fall back to 5002. Set
  // `FIREBASE_HOSTING_EMULATOR_PORT=5002` in .env.local to match.
  const hostingPort =
    loaded.FIREBASE_HOSTING_EMULATOR_PORT ??
    loaded.VITE_FIREBASE_HOSTING_EMULATOR_PORT ??
    '5002';
  const hostingTarget = `http://127.0.0.1:${hostingPort}`;

  // Firebase Functions emulator port. The reviewer RPC + agent card go
  // straight here in dev (bypassing the hosting layer) because the
  // hosting emulator's proxy enforces a hard ~60s timeout on rewrites
  // that we can't override, and our `reviewFull` calls can legitimately
  // run 60–120s (Gemini 2.5 Pro + PDF render + GCS upload + the
  // payment-verification retry budget on the server). The function
  // itself is configured with a 540s timeout.
  const functionsPort =
    loaded.FIREBASE_FUNCTIONS_EMULATOR_PORT ??
    loaded.VITE_FIREBASE_FUNCTIONS_EMULATOR_PORT ??
    '5001';
  const functionsProjectId =
    loaded.FIREBASE_PROJECT_ID ?? loaded.VITE_FIREBASE_PROJECT_ID ?? 'tribe-y';

  // Default: dev hits the deployed reviewer at tribe-y.web.app so a
  // fresh `npm run dev` works with zero local setup — no Functions
  // emulator, no GOOGLE_AI_API_KEY or wallet secret on disk. The agent
  // card served from prod advertises the direct Cloud Run URL for /rpc,
  // so only the discovery proxy actually has to hit prod from the dev
  // server. Set DEV_REVIEWER_TARGET to a local Functions emulator URL
  // (e.g. `http://127.0.0.1:5001/tribe-y/us-central1`) to force the
  // proxy there instead. Only needed when iterating on
  // `functions/src/reviewer/`.
  const emulatorReviewerBase = `http://127.0.0.1:${functionsPort}/${functionsProjectId}/us-central1`;
  const reviewerProxyTarget = loaded.DEV_REVIEWER_TARGET ?? 'https://tribe-y.web.app';
  const useEmulatorReviewer = reviewerProxyTarget === emulatorReviewerBase;

  return {
    plugins: [
      tailwindcss(),
      react(),
      apiProxyPlugin({
        GOOGLE_AI_API_KEY: loaded.GOOGLE_AI_API_KEY ?? loaded.VITE_GOOGLE_AI_API_KEY,
        VITE_FIREBASE_API_KEY: loaded.VITE_FIREBASE_API_KEY,
      }),
    ],
    server: {
      proxy: {
        '/api': {
          target: hostingTarget,
          changeOrigin: true,
        },
        // A2A reviewer surfaces. In dev we bypass the Hosting emulator
        // and call the Functions emulator directly so long-running
        // `reviewFull` calls don't hit hosting's 60s rewrite timeout.
        // Production deployments use the same /rpc and /.well-known/
        // paths via firebase.json rewrites; only the dev proxy differs.
        '/rpc': {
          target: reviewerProxyTarget,
          changeOrigin: true,
          rewrite: useEmulatorReviewer ? () => '/reviewerRpc' : undefined,
          // No upstream proxy timeout — let the function decide.
          timeout: 0,
          proxyTimeout: 0,
        },
        '/.well-known/agent.json': {
          target: reviewerProxyTarget,
          changeOrigin: true,
          rewrite: useEmulatorReviewer ? () => '/agentCard' : undefined,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      exclude: ['**/node_modules/**', '**/dist/**', 'functions/**', '.claude/**'],
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
