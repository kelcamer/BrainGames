import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Served from https://kelcamer.github.io/BrainGames/
export default defineConfig({
  base: "/BrainGames/",
  plugins: [react()],
});
