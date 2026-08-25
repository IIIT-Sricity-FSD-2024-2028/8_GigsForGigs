import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './context/AuthContext/AuthContext.tsx'
import { ClientProvider } from './context/ClientContext/ClientContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ClientProvider>
        <App />
      </ClientProvider>
    </AuthProvider>
  </StrictMode>,
)

