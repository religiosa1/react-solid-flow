/// <reference types="vitest" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: "classic",
    }),
  ],
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
  },
});
