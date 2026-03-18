import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Removed StrictMode to prevent auth lifecycle race conditions (double-mounting)
createRoot(document.getElementById('root')).render(
  <App />
)
