import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      exclude: [
        "*.config.js",
        "*.config.ts",
        "tailwind.config.js",
        "**/*.d.ts",
        "**/node_modules/**",
        "**/dist/**",
      ],
    },
  },
});
