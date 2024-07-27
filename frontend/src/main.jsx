import React from 'react'
import ReactDOM from 'react-dom/client'
import { App } from '@components/App'
import { GameProvider } from '@context/GameContext.jsx';

import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <GameProvider>
      <App />
    </GameProvider>
  </React.StrictMode>,
)


