import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/Chess-Lights-Out/',
  resolve: {
    alias: {
      '@components': '/src/components',
      '@assets': '/src/assets',
      '@config': '/src/config.js',
    },
  },

})
