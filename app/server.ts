import { showRoutes } from 'hono/dev'
import { createApp } from 'honox/server'

const app = createApp()

// Menampilkan daftar rute di terminal saat mode development (sangat membantu debugging)
showRoutes(app)

export default app