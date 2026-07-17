import { useCallback, useEffect, useRef, useState } from 'react'
import { trimAudioBlob } from '../utils/trimAudio'
import './AudioRecorder.css'

function formatTime(seconds) {
  const s = Math.max(0, seconds)
  const m = Math.floor(s / 60)
  const rem = Math.floor(s % 60)
  return `${m}:${String(rem).padStart(2, '0')}`
}

export default function AudioRecorder() {
  const [status, setStatus] = useState('idle') // idle | recording | review | sending | sent
  const [elapsed, setElapsed] = useState(0)
  const [error, setError] = useState(null)

  const [audioUrl, setAudioUrl] = useState(null)
  const [duration, setDuration] = useState(0)
  const [trimStart, setTrimStart] = useState(0)
  const [trimEnd, setTrimEnd] = useState(0)
  const [playhead, setPlayhead] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const audioBlobRef = useRef(null)
  const timerRef = useRef(null)
  const audioElRef = useRef(null)
  const trackRef = useRef(null)
  const dragHandleRef = useRef(null)

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach((t) => t.stop())
      if (audioUrl) URL.revokeObjectURL(audioUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const startRecording = async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = handleStopped
      mediaRecorderRef.current = recorder
      recorder.start()

      setStatus('recording')
      setElapsed(0)
      timerRef.current = setInterval(() => setElapsed((t) => t + 1), 1000)
    } catch (err) {
      setError("Couldn't access your microphone. Check your browser permissions and try again.")
    }
  }

  const stopRecording = () => {
    clearInterval(timerRef.current)
    mediaRecorderRef.current?.stop()
  }

  const handleStopped = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    audioBlobRef.current = blob
    setAudioUrl(URL.createObjectURL(blob))
    setStatus('review')
  }

  // Chrome reports Infinity for a fresh webm blob's duration until you seek
  // past the end once; this nudges it into reporting the real value.
  const handleLoadedMetadata = () => {
    const el = audioElRef.current
    if (!el) return
    if (el.duration === Infinity || Number.isNaN(el.duration)) {
      el.currentTime = 1e101
      const onTimeUpdate = () => {
        el.removeEventListener('timeupdate', onTimeUpdate)
        setDuration(el.duration)
        setTrimEnd(el.duration)
        el.currentTime = 0
      }
      el.addEventListener('timeupdate', onTimeUpdate)
    } else {
      setDuration(el.duration)
      setTrimEnd(el.duration)
    }
  }

  const handleTimeUpdate = () => {
    const el = audioElRef.current
    if (!el) return
    setPlayhead(el.currentTime)
    if (el.currentTime >= trimEnd) {
      el.pause()
      el.currentTime = trimStart
      setIsPlaying(false)
    }
  }

  const togglePlay = () => {
    const el = audioElRef.current
    if (!el) return
    if (isPlaying) {
      el.pause()
      setIsPlaying(false)
    } else {
      if (el.currentTime < trimStart || el.currentTime >= trimEnd) {
        el.currentTime = trimStart
      }
      el.play()
      setIsPlaying(true)
    }
  }

  const timeFromClientX = useCallback((clientX) => {
    const track = trackRef.current
    if (!track || duration === 0) return 0
    const rect = track.getBoundingClientRect()
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width))
    return ratio * duration
  }, [duration])

  const beginDrag = (handle) => (e) => {
    e.preventDefault()
    dragHandleRef.current = handle
    audioElRef.current?.pause()
    setIsPlaying(false)
    window.addEventListener('pointermove', handleDrag)
    window.addEventListener('pointerup', endDrag)
  }

  const handleDrag = (e) => {
    const handle = dragHandleRef.current
    if (!handle) return
    const t = timeFromClientX(e.clientX)
    if (handle === 'start') {
      setTrimStart(Math.min(t, trimEnd - 0.15))
    } else {
      setTrimEnd(Math.max(t, trimStart + 0.15))
    }
  }

  const endDrag = () => {
    dragHandleRef.current = null
    window.removeEventListener('pointermove', handleDrag)
    window.removeEventListener('pointerup', endDrag)
  }

  const retake = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    audioBlobRef.current = null
    setAudioUrl(null)
    setDuration(0)
    setTrimStart(0)
    setTrimEnd(0)
    setPlayhead(0)
    setIsPlaying(false)
    setStatus('idle')
  }

  const send = async () => {
    setStatus('sending')
    try {
      const trimmedBlob = await trimAudioBlob(audioBlobRef.current, trimStart, trimEnd)
      // No backend yet — this is where the trimmed clip would be POSTed.
      console.log('VentBuddy: trimmed clip ready to send', trimmedBlob)
      setStatus('sent')
    } catch (err) {
      setError("Something went wrong preparing your recording. Give it another try.")
      setStatus('review')
    }
  }

  const startPct = duration ? (trimStart / duration) * 100 : 0
  const endPct = duration ? (trimEnd / duration) * 100 : 100
  const playheadPct = duration ? (playhead / duration) * 100 : 0

  if (status === 'sent') {
    return (
      <div className="recorder sent">
        <div className="sent-check">✓</div>
        <p>Sent. That's it for now — thanks for sharing.</p>
        <button className="ghost-button" onClick={retake}>
          Record another
        </button>
      </div>
    )
  }

  return (
    <div className="recorder">
      {error && <p className="recorder-error">{error}</p>}

      {status === 'idle' && (
        <button className="mic-button" onClick={startRecording} aria-label="Start recording">
          <MicIcon />
        </button>
      )}

      {status === 'recording' && (
        <div className="recording-state">
          <button className="mic-button recording" onClick={stopRecording} aria-label="Stop recording">
            <StopIcon />
          </button>
          <div className="recording-meta">
            <span className="rec-dot" />
            <span>{formatTime(elapsed)}</span>
          </div>
        </div>
      )}

      {(status === 'review' || status === 'sending') && (
        <div className="review-state">
          <audio
            ref={audioElRef}
            src={audioUrl}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => setIsPlaying(false)}
          />

          <div className="review-controls">
            <button className="play-button" onClick={togglePlay} aria-label={isPlaying ? 'Pause' : 'Play'}>
              {isPlaying ? <PauseIcon /> : <PlayIcon />}
            </button>
            <span className="time-readout">
              {formatTime(Math.max(0, playhead - trimStart))} / {formatTime(trimEnd - trimStart)}
            </span>
          </div>

          <div className="trim-track" ref={trackRef}>
            <div className="trim-track-bg" />
            <div
              className="trim-range"
              style={{ left: `${startPct}%`, width: `${endPct - startPct}%` }}
            />
            <div className="trim-playhead" style={{ left: `${playheadPct}%` }} />
            <div
              className="trim-handle start"
              style={{ left: `${startPct}%` }}
              onPointerDown={beginDrag('start')}
            />
            <div
              className="trim-handle end"
              style={{ left: `${endPct}%` }}
              onPointerDown={beginDrag('end')}
            />
          </div>
          <p className="trim-hint">Drag the handles to trim your clip</p>

          <div className="review-actions">
            <button className="ghost-button" onClick={retake} disabled={status === 'sending'}>
              Retake
            </button>
            <button className="primary-button" onClick={send} disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : 'Send'}
            </button>
          </div>
        </div>
      )}
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

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M8 5v14l11-7-11-7Z" fill="currentColor" />
    </svg>
  )
}

function PauseIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
      <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
    </svg>
  )
}
