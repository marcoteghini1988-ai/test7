import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TacticalDuelPrototype from './TacticalDuelPrototype.jsx'

// Sandbox opt-in, senza modificare campagna, inventario, ricompense o PvP ufficiale.
const tacticalPreview = new URLSearchParams(window.location.search).get('tacticalPreview') === '1'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {tacticalPreview ? <TacticalDuelPrototype /> : <App />}
  </StrictMode>,
)
