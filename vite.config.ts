/// <reference types="vitest" />
import { name } from "./package.json";
import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";
import dts from "vite-plugin-dts";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    dts({ insertTypesEntry: true }),
  ],
  test: {
    globals: false,
    environment: "jsdom",
    setupFiles: "./test/setup.ts",
  },
  build: {
    lib: {
      name,
      entry: resolve(__dirname, "src/lib.ts"),
      formats: ["es", "umd"],
      fileName: (format) => `${name}.${format}.${format === "es" ? "mjs" : "js"}`,
    },
    rollupOptions: {
      external: [
        "react",
        "react/jsx-runtime",
        "react-dom",
      ],
      output: {
        globals: {
          react: "React",
          "react/jsx-runtime": "jsxRuntime",
          "react-dom": "ReactDOM",
        },
      },
    },
  },
});
