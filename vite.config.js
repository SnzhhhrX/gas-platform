import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Backend встроен в Vite: `npm run dev` поднимает и сайт, и API (/api). Отдельный процесс не нужен.
const gasApi = () => {
  const mount = async (server) => {
    const { handler } = await import('./server/index.js')
    server.middlewares.use((req, res, next) => handler(req, res, next))
  }
  return { name: 'gas-api', configureServer: mount, configurePreviewServer: mount }
}

export default defineConfig({ plugins: [react(), gasApi()] })
