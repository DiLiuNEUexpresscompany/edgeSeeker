import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import WindiCSS from 'vite-plugin-windicss'

export default defineConfig({
  plugins: [
    react(),
    WindiCSS(),
  ],
  server: {
    port: 5173, // Vite 服务器运行在 5173 端口
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000', // 代理到 5000 端口
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // 确保请求路径正确
      }
    }
  }
})
