import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    // Commented out HTTPS for local development
    // https: {
    //   key: fs.readFileSync(path.resolve(__dirname, ".cert/localhost+2-key.pem")),
    //   cert: fs.readFileSync(path.resolve(__dirname, ".cert/localhost+2.pem")),
    // },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
