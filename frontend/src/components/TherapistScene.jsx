import './TherapistScene.css'

export default function TherapistScene() {
  return (
    <div className="therapist-wrapper" aria-hidden="true">
      <svg
        className="therapist-svg"
        viewBox="0 0 420 400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <ellipse className="rug" cx="210" cy="372" rx="160" ry="16" />

        {/* chair */}
        <rect className="chair-back" x="90" y="120" width="240" height="220" rx="46" />
        <rect className="chair-arm left" x="68" y="212" width="42" height="112" rx="18" />
        <rect className="chair-arm right" x="310" y="212" width="42" height="112" rx="18" />
        <rect className="chair-seat" x="98" y="288" width="224" height="46" rx="20" />
        <rect className="chair-leg left" x="112" y="336" width="10" height="34" rx="4" />
        <rect className="chair-leg right" x="298" y="336" width="10" height="34" rx="4" />

        {/* person */}
        <g className="person">
          <rect className="leg left" x="168" y="298" width="34" height="76" rx="16" />
          <rect className="leg right" x="218" y="298" width="34" height="76" rx="16" />
          <ellipse className="shoe left" cx="185" cy="376" rx="20" ry="10" />
          <ellipse className="shoe right" cx="235" cy="376" rx="20" ry="10" />

          <g className="torso-group">
            <rect className="arm left" x="128" y="206" width="34" height="92" rx="17" />
            <rect className="arm right" x="258" y="206" width="34" height="92" rx="17" />
            <circle className="hand left" cx="145" cy="292" r="13" />
            <circle className="hand right" cx="275" cy="292" r="13" />

            <path
              className="torso"
              d="M150 250 C150 195 172 170 210 170 C248 170 270 195 270 250 L270 300 C270 316 252 326 210 326 C168 326 150 316 150 300 Z"
            />

            <rect className="neck" x="195" y="158" width="30" height="26" rx="8" />

            <g className="head-group">
              <circle className="head" cx="210" cy="128" r="46" />
              <path
                className="hair-back"
                d="M164 118 C160 84 182 56 210 56 C238 56 260 84 256 118 L256 140 C256 108 236 96 210 96 C184 96 164 108 164 140 Z"
              />
              <path
                className="hair-top"
                d="M164 122 C162 84 184 54 210 54 C236 54 258 84 256 122 C250 100 232 86 210 86 C188 86 170 100 164 122 Z"
              />

              <g className="eyes">
                <circle className="eye left" cx="193" cy="130" r="4" />
                <circle className="eye right" cx="227" cy="130" r="4" />
              </g>
              <path className="smile" d="M195 146 Q210 156 225 146" strokeLinecap="round" />
              <circle className="blush left" cx="182" cy="140" r="6" />
              <circle className="blush right" cx="238" cy="140" r="6" />
            </g>
          </g>
        </g>
      </svg>
    </div>
  )
}
