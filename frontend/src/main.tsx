import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import { Analytics } from '@vercel/analytics/react'
import { GoogleOAuthProvider } from '@react-oauth/google'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID ?? ''}>
      <App />
      <Analytics />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#FFFFFF',
            color: '#111111',
            border: '1px solid #EAEAEA',
            borderRadius: '8px',
            fontSize: '14px',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
          },
          success: {
            iconTheme: { primary: '#346538', secondary: '#EDF3EC' },
          },
          error: {
            iconTheme: { primary: '#9F2F2D', secondary: '#FDEBEC' },
          },
        }}
      />
    </GoogleOAuthProvider>
  </StrictMode>,
)
