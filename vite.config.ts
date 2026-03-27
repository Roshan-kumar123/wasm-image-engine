import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import wasm from 'vite-plugin-wasm';

export default defineConfig({
  plugins: [
    wasm(),
    react(),
    tailwindcss(),
  ],
  optimizeDeps: {
    // Prevent esbuild from touching the Wasm package — vite-plugin-wasm handles it
    exclude: ['wasm-processor'],
  },
  worker: {
    format: 'es',
    // The worker has its own Rollup pipeline; wasm must be listed here too
    plugins: () => [wasm()],
  },
});
