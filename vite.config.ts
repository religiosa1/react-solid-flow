/// <reference types="vitest" />
import { name } from "./package.json";
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }),
    tsconfigPaths(),
  ],
  test: {
    globals: false,
    environment: 'jsdom',
    setupFiles: "./test/setup.ts",
  },
  build: {
    lib: {
      name,
      entry: resolve(__dirname, 'src/lib.ts'),
      formats: ['es', 'umd'],
      fileName: (format) => `${name}.${format}.${format === "es" ? "mjs" : "js"}`,
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
})
