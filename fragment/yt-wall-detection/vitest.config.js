import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./tests/setup.js",
    includeSource: ["src/**/*.{js,ts,jsx,tsx}"],
  },
});
