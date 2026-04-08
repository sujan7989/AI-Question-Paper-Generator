import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Base path - use '/' for Vercel, '/quizzy-ai-paper-forge/' for GitHub Pages
  base: '/',
  
  server: {
    host: "0.0.0.0", // Listen on all network interfaces (allows access from other devices)
    port: 8080,
    strictPort: true,
    watch: {
      usePolling: false,
      useFsEvents: false,
    },
  },
  plugins: [
    react(),
    mode === 'development' &&
    componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    exclude: ['@tanstack/react-query', 'pdfjs-dist'],
  },
  worker: {
    format: 'es',
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Core React
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'react-vendor';
          }
          // Supabase
          if (id.includes('node_modules/@supabase/')) {
            return 'supabase';
          }
          // Radix UI + lucide
          if (id.includes('node_modules/@radix-ui/') || id.includes('node_modules/lucide-react/')) {
            return 'ui-vendor';
          }
          // React Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'query';
          }
          // PDF processing — large, lazy load
          if (id.includes('node_modules/pdfjs-dist/') || id.includes('node_modules/pdf-parse/')) {
            return 'pdf-vendor';
          }
          // Recharts
          if (id.includes('node_modules/recharts/') || id.includes('node_modules/d3-')) {
            return 'charts-vendor';
          }
          // Heavy app components — split into separate chunk
          if (id.includes('src/components/Analytics') || id.includes('src/components/UserManagement')) {
            return 'admin-chunk';
          }
          if (id.includes('src/components/QuestionPaperPreview') || id.includes('src/components/PaperComparison')) {
            return 'preview-chunk';
          }
          if (id.includes('src/lib/paper') || id.includes('src/lib/ai') || id.includes('src/lib/subject-manager')) {
            return 'core-lib';
          }
        },
      },
    },
  },
}));
