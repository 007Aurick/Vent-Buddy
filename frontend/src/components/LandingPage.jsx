import './LandingPage.css'

export default function LandingPage({ onStart }) {
  return (
    <div className="landing">
      <div className="landing-bg">
        <div className="blob blob-a" />
        <div className="blob blob-b" />
        <div className="blob blob-c" />
      </div>

      <div className="landing-content">
        <h1 className="landing-title">VentBuddy</h1>
        <p className="landing-tagline">
          No notes. No judgment.
          <br />
          Just somewhere to say what's on your mind.
        </p>
        <button className="start-button" onClick={onStart}>
          <span>Start Session</span>
        </button>
      </div>
    </div>
  )
}
