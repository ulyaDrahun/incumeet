import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

const publishableEnvFallbacks = {
  VITE_SUPABASE_PROJECT_ID: "gvloxhlfujrwopemrlpl",
  VITE_SUPABASE_PUBLISHABLE_KEY:
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd2bG94aGxmdWpyd29wZW1ybHBsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc2NTY2NTMsImV4cCI6MjA4MzIzMjY1M30.nBFXBlBh6OO3Z7EY0ztnvs57UMStRH1K0gTr1rYKw7g",
  VITE_SUPABASE_URL: "https://gvloxhlfujrwopemrlpl.supabase.co",
} as const;

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const clientEnv = {
    ...publishableEnvFallbacks,
    ...Object.fromEntries(Object.entries(env).filter(([key]) => key.startsWith("VITE_"))),
  };

  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    define: {
      "import.meta.env.VITE_SUPABASE_PROJECT_ID": JSON.stringify(clientEnv.VITE_SUPABASE_PROJECT_ID),
      "import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY": JSON.stringify(clientEnv.VITE_SUPABASE_PUBLISHABLE_KEY),
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(clientEnv.VITE_SUPABASE_URL),
    },
  };
});
