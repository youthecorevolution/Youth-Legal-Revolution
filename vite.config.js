import { defineConfig } from 'vite';
export default defineConfig({
  appType: 'mpa',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rolldownOptions: {
      input: {
        index: 'index.html',
        overview: 'overview.html'
      }
    }
  }
});
