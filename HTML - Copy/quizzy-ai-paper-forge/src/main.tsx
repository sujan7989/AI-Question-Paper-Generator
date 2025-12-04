
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './components/ThemeProvider'
import { AppProvider } from './contexts/AppContext'
import './lib/test-ai' // Load AI test utilities
import './lib/test-pdf' // Load PDF test utilities
import './lib/comprehensive-test' // Load comprehensive test suite
import './lib/system-test' // Load system test
import './lib/debug-pdf' // Load PDF debug utilities
import './lib/final-test' // Load final comprehensive test
import './lib/test-nvidia' // Load NVIDIA Qwen test
import './lib/test-content-aware' // Load content-aware test
import './lib/final-verification' // Load final verification suite

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
