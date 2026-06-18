import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  esbuild: {
    supported: {
      'destructuring': true
    }
  },
  optimizeDeps: {
    esbuildOptions: {
      supported: {
        'destructuring': true
      }
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  build: {
    // For local dev: build into Spring Boot static folder
    // For Vercel: build into dist/ (set via VITE_BUILD_TARGET=vercel)
    outDir: process.env.VITE_BUILD_TARGET === 'vercel' ? 'dist' : '../server/src/main/resources/static',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler')) {
              return 'vendor-react';
            }
            if (id.includes('html5-qrcode')) {
              return 'vendor-qrcode';
            }
            return 'vendor';
          }
        }
      }
    }
  }
}));
