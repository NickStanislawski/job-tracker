import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base so the built app works at https://<user>.github.io/<repo>/
  // without needing to hardcode the repo name here.
  base: "./",
});
