import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Splash from './components/Splash'
import { initPress } from './lib/press'
import { detectBackend } from './lib/api'
import { initTheme } from './lib/theme'
import './styles/base.css'
import './styles/polish.css'
import './styles/gas.css'
import './styles/ui2.css'
import './styles/profile.css'
import './styles/minimal.css'
import './styles/profile2.css'

initTheme()
// Узнаём, запущен ли backend (/api/health), и только потом рисуем приложение
initPress()
const root = createRoot(document.getElementById('root'))
root.render(<Splash />) // Гас виден сразу, пока проверяется backend
detectBackend().finally(() => root.render(<App />))
