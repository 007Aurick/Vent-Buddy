import { useRef, useState } from 'react'
import './SessionControl.css'

export default function SessionControl({ status, error, onRecordingComplete, reportUrl, onRestart }) {
  const [recording, setRecording] = useState(false)
  const [micError, setMicError] = useState(null)
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)

  const busy = status === 'processing'

  const getSupportedMimeType = () => {
    if (typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported) return ''
    const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
    return candidates.find((type) => MediaRecorder.isTypeSupported(type)) || ''
  }

  const startRecording = async () => {
    setMicError(null)

    // iOS Safari only allows speechSynthesis to be triggered from a direct
    // tap — by the time the reply comes back (after two awaited network
    // calls) it's too late. "Unlocking" it here, still inside this tap's
    // call stack, lets the later speak() call in SessionPage actually work.
    if (window.speechSynthesis) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(''))
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const mimeType = getSupportedMimeType()
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        streamRef.current?.getTracks().forEach((t) => t.stop())
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || 'audio/webm' })
        setRecording(false)
        onRecordingComplete(blob)
      }
      mediaRecorderRef.current = recorder
      recorder.start()
      setRecording(true)
    } catch {
      setMicError("Couldn't access your microphone. Check your browser permissions and try again.")
    }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
  }

  const toggleRecording = () => {
    if (recording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  if (status === 'finished') {
    return (
      <div className="session-control">
        <div className="session-control-finished">
          <p className="session-control-hint">Your conversation has ended.</p>
          {error && <p className="session-control-error">{error}</p>}
          {reportUrl ? (
            <a className="primary-button" href={reportUrl} download="VentBuddy_Report.pdf">
              Download Report
            </a>
          ) : (
            !error && <p className="session-control-hint">Preparing your report…</p>
          )}
          <button className="ghost-button" onClick={onRestart}>
            Start New Conversation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="session-control">
      {(error || micError) && <p className="session-control-error">{error || micError}</p>}

      <button
        className={`mic-button ${recording ? 'recording' : ''} ${busy ? 'running' : ''}`}
        onClick={toggleRecording}
        disabled={busy}
        aria-label={recording ? 'Stop recording' : 'Start recording'}
      >
        {recording ? <StopIcon /> : <MicIcon />}
      </button>
      <p className="session-control-hint">
        {recording ? 'Recording — tap to send' : busy ? 'One sec…' : 'Tap to talk'}
      </p>
    </div>
  )
}

function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="9" y="2" width="6" height="12" rx="3" fill="currentColor" />
      <path
        d="M5 11a7 7 0 0 0 14 0M12 18v3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

function StopIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
    </svg>
  )
}
