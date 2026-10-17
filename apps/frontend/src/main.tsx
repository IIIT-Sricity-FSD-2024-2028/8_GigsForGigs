/**
 * @file main.tsx
 * @description Browser entry point. Mounts <App /> into the #root div from index.html.
 * All context providers (auth, toasts, per-role data) are set up inside App.tsx.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  // StrictMode runs extra dev-only checks (double-invokes effects to surface bugs).
  <StrictMode>
    <App />
  </StrictMode>,
)
