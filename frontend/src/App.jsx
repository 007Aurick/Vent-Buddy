import { useState } from 'react'
import LandingPage from './components/LandingPage'
import SessionPage from './components/SessionPage'

function App() {
  const [view, setView] = useState('landing') // 'landing' | 'session'

  if (view === 'session') {
    return <SessionPage onExit={() => setView('landing')} />
  }

  return <LandingPage onStart={() => setView('session')} />
}

export default App
