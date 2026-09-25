import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext.tsx'
import { ParoisseProvider } from './contexts/ParoisseContext.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <ParoisseProvider>
        <App />
      </ParoisseProvider>
    </AuthProvider>
  </StrictMode>,
)
