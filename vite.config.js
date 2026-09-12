import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative paths so the build works on GitHub Pages project sites,
  // Netlify, Vercel and Cloudflare Pages without any change.
  base: "./",
});
