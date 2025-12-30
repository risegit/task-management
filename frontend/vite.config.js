import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isLocal = mode === "development";

  // ✅ Automatically use correct base path depending on environment
  const base = isLocal ? "/" : "/";

  console.log("----------------------------------------------------");
  console.log("🚀 VITE CONFIG LOADED");
  console.log("Mode:", mode);
  console.log("Environment:", isLocal ? "Local" : "Production");
  console.log("Base path being used:", base);
  console.log("----------------------------------------------------");

  return {
    plugins: [react()],
    resolve: {
      alias: [{ find: "@", replacement: "/src" }],
    },
    base, // 👈 controls how asset URLs are generated
    build: {
      assetsDir: "assets", // puts images, CSS, JS in /assets
    },
  };
});



