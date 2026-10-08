import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// base "./" keeps asset paths relative, so the same build runs from Vercel or an IPFS gateway path
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
});
