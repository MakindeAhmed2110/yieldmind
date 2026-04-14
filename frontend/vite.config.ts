import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [tailwindcss(), reactRouter()],
    resolve: {
      tsconfigPaths: true,
    },
    define: {
      "process.env.OPENROUTER_API_KEY": JSON.stringify(
        env.OPENROUTER_API_KEY ?? "",
      ),
      "process.env.OPENROUTER_MODEL": JSON.stringify(
        env.OPENROUTER_MODEL ?? "",
      ),
    },
  };
});
