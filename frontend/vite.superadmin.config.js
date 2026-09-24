import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'superadmin-rewrite',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          const path = (req.url || '/').split('?')[0];
          if (path === '/' || path === '/index.html') {
            const query = req.url.includes('?') ? '?' + req.url.split('?')[1] : '';
            req.url = '/superadmin.html' + query;
          }
          next();
        });
      }
    }
  ],
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: {
      input: 'superadmin.html'
    }
  }
});
