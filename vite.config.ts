import { defineConfig } from 'vite'
import path from "path"
import react from '@vitejs/plugin-react'


// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    minify: true,
    sourcemap: 'inline', // Use inline source maps for better error reporting
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit to 1MB
    rollupOptions: {
      output: {
        sourcemapExcludeSources: false, // Include original source in source maps
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-select'],
        },
      },
    },
  },
  // Enable source maps in development too
  css: {
    devSourcemap: true,
  },
  server: {
    allowedHosts: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  optimizeDeps: {
    // This is still crucial for reducing the time from when `bun run dev`
    // is executed to when the server is actually ready.
    include: ['react', 'react-dom', 'react-router-dom'],
    exclude: ['agents'], // Exclude agents package from pre-bundling due to Node.js dependencies
    force: true,
  },
  define: {
    // Define Node.js globals for the agents package
    global: 'globalThis',
  },
  // Clear cache more aggressively
  cacheDir: 'node_modules/.vite'
})