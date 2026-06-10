import pages from '@hono/vite-cloudflare-pages'
import honox from 'honox/vite'
import client from 'honox/vite/client'
import { defineConfig } from 'vite'

export default defineConfig(({ mode }) => {
  // Jika mode build adalah client, render aset sisi klien
  if (mode === 'client') {
    return {
      plugins: [client()]
    }
  } 
  
  // Jika mode server, gunakan adapter HonoX dan Cloudflare Pages
  return {
    plugins: [
      honox(),
      pages()
    ]
  }
})