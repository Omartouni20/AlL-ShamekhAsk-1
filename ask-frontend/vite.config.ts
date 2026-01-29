import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json'],
    alias: {
      // مهم: ده اللي بيحل مشكلة figma:asset
      'figma:asset/9dd806c39decc1e8553ad45cfbf0fe091377c9df.png': path.resolve(
        __dirname,
        './src/assets/9dd806c39decc1e8553ad45cfbf0fe091377c9df.png'
      ),
      // alias الأساسي
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    outDir: 'build',
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      // استخدم المتغير البيئي هنا لتحديد السيرفر
      '/api': `${import.meta.env.VITE_API_BASE}`,
      '/uploads': `${import.meta.env.VITE_UPLOADS_BASE}`,
      '/health': `${import.meta.env.VITE_API_BASE}`,
    },
  },
});
