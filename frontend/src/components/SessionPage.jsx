import { useEffect, useRef, useState } from 'react'
import TherapistScene from './TherapistScene'
import SessionControl from './SessionControl'
import './SessionPage.css'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000'
const GREETING = "Hi, I'm VentBuddy. I'm here to help you vent — whenever you're ready."

const EXIT_PHRASES = [
  'exit', 'quit', 'goodbye', 'good bye', 'bye',
  "that's all", 'thats all', "i'm done", 'im done',
  "i'm good", "that's it", 'thats it', 'see you', 'talk later',
]

function speak(text) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve()
      return
    }
    // iOS Safari can silently drop an utterance without ever firing
    // onend/onerror, which would otherwise hang this promise forever and
    // leave the mic button stuck disabled. Cap how long we wait.
    let done = false
    const finish = () => {
      if (done) return
      done = true
      clearTimeout(timer)
      resolve()
    }
    const timer = setTimeout(finish, Math.max(4000, text.length * 90))

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.onend = finish
    utterance.onerror = finish
    window.speechSynthesis.speak(utterance)
  })
}

function fileNameForBlob(blob) {
  if (blob.type.includes('mp4')) return 'clip.m4a'
  if (blob.type.includes('ogg')) return 'clip.ogg'
  if (blob.type.includes('wav')) return 'clip.wav'
  return 'clip.webm'
}

export default function SessionPage({ onExit }) {
  const [showGreeting, setShowGreeting] = useState(false)
  const [status, setStatus] = useState('idle') // idle | processing | finished
  const [phase, setPhase] = useState(null) // transcribing | thinking | speaking | wrapping-up
  const [error, setError] = useState(null)
  const [latestReply, setLatestReply] = useState(null)
  const [reportUrl, setReportUrl] = useState(null)
  const historyRef = useRef([]) // [{role, content}]

  useEffect(() => {
    const t = setTimeout(() => setShowGreeting(true), 700)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    return () => {
      if (reportUrl) URL.revokeObjectURL(reportUrl)
    }
  }, [reportUrl])

  const finishSession = async () => {
    setPhase('wrapping-up')
    try {
      const res = await fetch(`${API_BASE}/api/summary`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ history: historyRef.current }),
      })
      if (!res.ok) throw new Error('summary failed')
      const blob = await res.blob()
      setReportUrl(URL.createObjectURL(blob))
    } catch {
      setError("Couldn't prepare your report, but your conversation has ended.")
    }
    setStatus('finished')
    setPhase(null)
  }

  const handleRecordingComplete = async (audioBlob) => {
    setStatus('processing')
    setError(null)
    try {
      setPhase('transcribing')
      const form = new FormData()
      form.append('audio', audioBlob, fileNameForBlob(audioBlob))
      const transcribeRes = await fetch(`${API_BASE}/api/transcribe`, { method: 'POST', body: form })
      if (!transcribeRes.ok) throw new Error('transcription failed')
      const { text } = await transcribeRes.json()
      const person = (text || '').trim()

      if (!person) {
        setStatus('idle')
        setPhase(null)
        return
      }

      if (EXIT_PHRASES.some((phrase) => person.toLowerCase().includes(phrase))) {
        await finishSession()
        return
      }

      setPhase('thinking')
      const chatRes = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: person, history: historyRef.current }),
      })
      if (!chatRes.ok) throw new Error('chat failed')
      const data = await chatRes.json()

      historyRef.current = [
        ...historyRef.current,
        { role: 'user', content: person },
        { role: 'assistant', content: data.reply },
      ]
      setLatestReply(data.reply)

      setPhase('speaking')
      await speak(data.reply)

      setStatus('idle')
      setPhase(null)
    } catch (err) {
      setError('Something went wrong. Check your connection and try again.')
      setStatus('idle')
      setPhase(null)
    }
  }

  const restart = () => {
    historyRef.current = []
    setLatestReply(null)
    setStatus('idle')
    setPhase(null)
    setError(null)
    if (reportUrl) URL.revokeObjectURL(reportUrl)
    setReportUrl(null)
  }

  const isThinking = phase === 'transcribing' || phase === 'thinking' || phase === 'wrapping-up'
  const bubbleText = latestReply || GREETING

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
          onRecordingComplete={handleRecordingComplete}
          reportUrl={reportUrl}
          onRestart={restart}
        />
      </div>
    </div>
  )
}
