import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/lib.ts"],
	splitting: false,
	sourcemap: true,
	clean: true,
	minify: true,
	format: ["esm", "cjs"],
});
