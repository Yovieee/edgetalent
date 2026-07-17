import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SupabaseProvider } from './context/SupabaseProvider.tsx'
import { HashRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SupabaseProvider>
      <HashRouter>
        <App />
      </HashRouter>
    </SupabaseProvider>
  </StrictMode>,
)

