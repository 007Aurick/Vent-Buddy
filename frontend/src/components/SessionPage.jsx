import { useEffect, useRef, useState } from 'react'
import TherapistScene from './TherapistScene'
import SessionControl from './SessionControl'
import './SessionPage.css'

const API_BASE = 'http://localhost:5000'
const POLL_INTERVAL_MS = 1500
const GREETING = "Hi, I'm VentBuddy. I'm here to help you vent — whenever you're ready."

export default function SessionPage({ onExit }) {
  const [showGreeting, setShowGreeting] = useState(false)
  const [status, setStatus] = useState('idle') // idle | starting | running | finished | error
  const [error, setError] = useState(null)
  const [chatState, setChatState] = useState('starting')
  const [latestReply, setLatestReply] = useState(null)
  const pollRef = useRef(null)

  useEffect(() => {
    const t = setTimeout(() => setShowGreeting(true), 700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => () => clearInterval(pollRef.current), [])

  const pollSession = () => {
    pollRef.current = setInterval(async () => {
      try {
        const [statusRes, transcriptRes] = await Promise.all([
          fetch(`${API_BASE}/status`),
          fetch(`${API_BASE}/transcript`),
        ])
        const statusData = await statusRes.json()
        const transcriptData = await transcriptRes.json()

        setChatState(transcriptData.state || 'starting')
        const lastAssistant = [...(transcriptData.messages || [])]
          .reverse()
          .find((m) => m.role === 'assistant')
        if (lastAssistant) setLatestReply(lastAssistant.content)

        if (statusData.status === 'finished') {
          clearInterval(pollRef.current)
          setStatus('finished')
        }
      } catch {
        // transient failure — keep polling
      }
    }, POLL_INTERVAL_MS)
  }

  const start = async () => {
    setStatus('starting')
    setError(null)
    setChatState('starting')
    setLatestReply(null)
    try {
      const res = await fetch(`${API_BASE}/start`, { method: 'POST' })
      if (!res.ok && res.status !== 409) throw new Error('Failed to start session')
      setStatus('running')
      pollSession()
    } catch (err) {
      setError("Couldn't reach VentBuddy. Make sure the server is running.")
      setStatus('error')
    }
  }

  const downloadReport = () => {
    window.open(`${API_BASE}/report/latest`, '_blank')
  }

  const restart = () => {
    clearInterval(pollRef.current)
    setStatus('idle')
    setError(null)
    setChatState('starting')
    setLatestReply(null)
  }

  const isThinking = status === 'running' && chatState === 'thinking'
  const bubbleText = (status === 'running' || status === 'finished') && latestReply ? latestReply : GREETING

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
            {isThinking ? (
              <span className="thinking-dots">
                <span />
                <span />
                <span />
              </span>
            ) : (
              bubbleText
            )}
          </div>
        </div>

        <SessionControl
          status={status}
          error={error}
          onStart={start}
          onDownload={downloadReport}
          onRestart={restart}
        />
      </div>
    </div>
  )
}
