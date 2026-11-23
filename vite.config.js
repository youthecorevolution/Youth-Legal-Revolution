import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        home: resolve(process.cwd(), 'index.html'),
        overview: resolve(process.cwd(), 'overview.html'),
        articles: resolve(process.cwd(), 'articles.html'),
        research: resolve(process.cwd(), 'research.html'),
        article: resolve(process.cwd(), 'article.html'),
        admin: resolve(process.cwd(), 'admin.html'),
        contact: resolve(process.cwd(), 'contact.html'),
        terms: resolve(process.cwd(), 'terms.html'),
        privacy: resolve(process.cwd(), 'privacy.html')
      }
    }
  }
});

