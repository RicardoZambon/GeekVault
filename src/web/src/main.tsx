import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider.tsx'
import { AuthProvider } from './components/auth-provider.tsx'
import './i18n/index.ts'
import './index.css'
import App from './App.tsx'
import { Toaster } from './components/ds/toaster.tsx'
import { TooltipProvider } from './components/ds/tooltip.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider defaultTheme="system" storageKey="geekvault-theme">
        <AuthProvider>
          <TooltipProvider delayDuration={0}>
            <App />
            <Toaster />
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
