import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        gift: path.resolve(__dirname, 'gift.html'),
        transactional: path.resolve(__dirname, 'transactional.html'),
        rfm: path.resolve(__dirname, 'rfm.html'),
        campaigns: path.resolve(__dirname, 'campaigns.html'),
        campaignsNew: path.resolve(__dirname, 'campaigns-new.html'),
        campaignDetail: path.resolve(__dirname, 'campaign-detail.html'),
      },
    },
  },
})
