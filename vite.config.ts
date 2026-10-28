import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // 배포(build)할 때만: GitHub Pages 주소가 shcs0113.github.io/Yeoui-To-Banpo/ 라서
  // 개발 서버(npm run dev)는 그대로 localhost:5173/ 에서 열린다
  base: command === 'build' ? '/Yeoui-To-Banpo/' : '/',
}));
