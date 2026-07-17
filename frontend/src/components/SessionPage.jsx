import { useEffect, useState } from 'react'
import TherapistScene from './TherapistScene'
import AudioRecorder from './AudioRecorder'
import './SessionPage.css'

const GREETING = "Hi, I'm VentBuddy. I'm here to help you vent — whenever you're ready."

export default function SessionPage({ onExit }) {
  const [showGreeting, setShowGreeting] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setShowGreeting(true), 700)
    return () => clearTimeout(t)
  }, [])

  return (
    <div className="session">
      <div className="session-bg">
        <div className="room-window" />
        <div className="room-plant">
          <span className="pot" />
          <span className="leaf leaf-1" />
          <span className="leaf leaf-2" />
          <span className="leaf leaf-3" />
          <span className="leaf leaf-4" />
          <span className="stem" />
        </div>
        <div className="room-lamp">
          <span className="lamp-shade" />
          <span className="lamp-pole" />
          <span className="lamp-base" />
        </div>
        <div className="room-table">
          <span className="vase" />
        </div>
      </div>

      <button className="exit-button" onClick={onExit}>
        ← Leave
      </button>

      <div className="session-content">
        <div className="therapist-stage">
          <TherapistScene />
          <div className={`speech-bubble ${showGreeting ? 'visible' : ''}`}>
            {GREETING}
          </div>
        </div>

        <AudioRecorder />
      </div>
    </div>
  )
}
