import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  // Expose REACT_APP_* env vars as process.env.REACT_APP_* (compat with existing CRA code)
  const defines = {};
  for (const key of Object.keys(env)) {
    if (key.startsWith("REACT_APP_")) {
      defines[`process.env.${key}`] = JSON.stringify(env[key]);
    }
  }
  defines["process.env.NODE_ENV"] = JSON.stringify(mode);

  return {
    plugins: [react()],
    resolve: {
      alias: { "@": path.resolve(__dirname, "src") },
    },
    define: defines,
    server: { port: 3000 },
    build: { outDir: "build" },
  };
});
