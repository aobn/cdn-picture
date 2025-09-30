import path from "path"
import tailwindcss from "@tailwindcss/vite"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      // 代理图片上传 API 请求
      '/upload': {
        target: 'https://api.cnb.cool',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/upload/, '/goxi.top/2323wew/-/upload')
      },
    }
  }
})
