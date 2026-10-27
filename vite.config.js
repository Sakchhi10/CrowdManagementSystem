import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Separate long-lived vendor chunks so the app code stays small and caches well.
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          charts: ['recharts'],
          net: ['axios', 'socket.io-client'],
        },
      },
    },
  },
});
