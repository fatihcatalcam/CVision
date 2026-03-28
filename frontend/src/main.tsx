import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
    <Toaster 
      position="top-right" 
      toastOptions={{
        style: {
          background: '#18181b',
          color: '#fafafa',
          border: '1px solid #27272a',
        },
        success: {
          iconTheme: {
            primary: '#10b981',
            secondary: '#18181b',
          },
        },
      }}
    />
  </StrictMode>,
)
