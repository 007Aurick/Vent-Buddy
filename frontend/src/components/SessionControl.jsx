import './SessionControl.css'

export default function SessionControl({ status, error, onStart, onDownload, onRestart }) {
  return (
    <div className="session-control">
      {error && <p className="session-control-error">{error}</p>}

      {(status === 'idle' || status === 'starting' || status === 'error') && (
        <button
          className="mic-button"
          onClick={onStart}
          disabled={status === 'starting'}
          aria-label="Start session"
        >
          {status === 'starting' ? '…' : <MicIcon />}
        </button>
      )}

      {status === 'running' && (
        <div className="mic-button running" aria-label="Session in progress">
          <MicIcon />
        </div>
      )}

      {status === 'finished' && (
        <div className="session-control-finished">
          <p className="session-control-hint">Your conversation has ended.</p>
          <button className="primary-button" onClick={onDownload}>
            Download Report
          </button>
          <button className="ghost-button" onClick={onRestart}>
            Start New Conversation
          </button>
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
