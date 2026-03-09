
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import { AppProvider } from './contexts/AppContext'

console.log('Starting application...')

const rootElement = document.getElementById("root")
if (!rootElement) {
  throw new Error('Root element not found')
}

console.log('Root element found, creating React app...')

createRoot(rootElement).render(
  <ThemeProvider>
    <AuthProvider>
      <AppProvider>
        <App />
      </AppProvider>
    </AuthProvider>
  </ThemeProvider>
);

console.log('React app rendered successfully')
