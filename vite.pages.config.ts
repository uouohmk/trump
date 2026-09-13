import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {fileURLToPath} from 'node:url';

export default defineConfig({
  root:fileURLToPath(new URL('./standalone',import.meta.url)),
  publicDir:fileURLToPath(new URL('./public',import.meta.url)),
  base:process.env.PAGES_BASE_PATH||'/trump/',
  plugins:[react()],
  build:{outDir:fileURLToPath(new URL('./pages-dist',import.meta.url)),emptyOutDir:true,sourcemap:false},
});
