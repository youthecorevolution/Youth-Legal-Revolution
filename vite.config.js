import { defineConfig } from 'vite';
import { resolve } from 'node:path';
export default defineConfig({build:{rollupOptions:{input:{home:resolve(import.meta.dirname,'index.html'),overview:resolve(import.meta.dirname,'overview.html'),articles:resolve(import.meta.dirname,'articles.html'),article:resolve(import.meta.dirname,'article.html'),admin:resolve(import.meta.dirname,'admin.html')}}}});
