import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Production-only Content-Security-Policy. Even if some user text ever reached
 * the DOM unescaped, the browser would refuse to run scripts that aren't our
 * own bundle. Dev is untouched (Vite's HMR needs inline scripts/websockets).
 * frame-ancestors can't be set via <meta>; set it as a header on your host.
 */
function contentSecurityPolicy(apiBaseUrl: string | undefined): Plugin {
  let apiOrigin = ''
  try {
    if (apiBaseUrl) apiOrigin = new URL(apiBaseUrl).origin
  } catch {
    throw new Error(`VITE_API_BASE_URL is not a valid URL: ${apiBaseUrl}`)
  }
  const csp = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' https: data:",
    `connect-src 'self'${apiOrigin ? ' ' + apiOrigin : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'content-security-policy',
    apply: 'build',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: csp }, injectTo: 'head-prepend' },
      { tag: 'meta', attrs: { name: 'referrer', content: 'strict-origin-when-cross-origin' }, injectTo: 'head' },
    ],
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), contentSecurityPolicy(loadEnv(mode, process.cwd(), 'VITE_').VITE_API_BASE_URL)],
  server: {
    host: true, // Listens on all local IP addresses (0.0.0.0)
    port: 5173
  }
}))
