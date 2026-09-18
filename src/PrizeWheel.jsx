import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'

const SEGMENTS = [
  { label: '1 day free',   color: '#27272A', text: '#A1A1AA' },
  { label: '1 month free', color: '#ED1E24', text: '#FFFFFF' },
  { label: 'Nothing',      color: '#18181B', text: '#71717A' },
  { label: '1 week free',  color: '#27272A', text: '#A1A1AA' },
  { label: '1 day free',   color: '#18181B', text: '#A1A1AA' },
  { label: '1 month free', color: '#ED1E24', text: '#FFFFFF' },
  { label: 'Nothing',      color: '#27272A', text: '#71717A' },
  { label: '1 week free',  color: '#18181B', text: '#A1A1AA' },
]

const WINNING_INDEX = 1
const SEG_ANGLE = 360 / SEGMENTS.length

function confettiBurst(canvas) {
  const ctx = canvas.getContext('2d')
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  const W = canvas.offsetWidth
  const H = canvas.offsetHeight
  canvas.width = W * dpr
  canvas.height = H * dpr
  ctx.scale(dpr, dpr)

  const colors = ['#ED1E24', '#FFFFFF', '#22C55E', '#8B5CF6', '#F59E0B', '#3B82F6', '#EC4899']
  const pieces = Array.from({ length: 180 }, () => ({
    x: W / 2 + (Math.random() - 0.5) * 40,
    y: H / 2,
    vx: (Math.random() - 0.5) * 28,
    vy: -Math.random() * 22 - 8,
    r: Math.random() * 7 + 2,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 360,
    rv: (Math.random() - 0.5) * 16,
    shape: Math.random() > 0.35 ? 'rect' : 'circle',
    gravity: 0.22 + Math.random() * 0.14,
    opacity: 1,
  }))

  let frame = 0
  const maxFrames = 180

  const draw = () => {
    if (frame > maxFrames) { ctx.clearRect(0, 0, W, H); return }
    ctx.clearRect(0, 0, W, H)
    for (const p of pieces) {
      p.x += p.vx
      p.vy += p.gravity
      p.y += p.vy
      p.vx *= 0.985
      p.rot += p.rv
      p.opacity = Math.max(0, 1 - (frame / maxFrames) * (frame / maxFrames))

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate((p.rot * Math.PI) / 180)
      ctx.globalAlpha = p.opacity
      ctx.fillStyle = p.color
      if (p.shape === 'rect') {
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r)
      } else {
        ctx.beginPath()
        ctx.arc(0, 0, p.r, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()
    }
    frame++
    requestAnimationFrame(draw)
  }
  requestAnimationFrame(draw)
}

function WheelSVG({ rotation, phase, size = 280 }) {
  return (
    <div className="relative" style={{ width: size, height: size }}>
      {/* Pointer */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-20">
        <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[22px] border-l-transparent border-r-transparent border-t-white drop-shadow-[0_2px_8px_rgba(237,30,36,0.5)]" />
      </div>

      {/* Glow behind wheel */}
      <div
        className="absolute inset-[-20%] rounded-full pointer-events-none transition-opacity duration-1000"
        style={{ background: 'radial-gradient(circle, rgba(237,30,36,0.25) 0%, transparent 70%)', opacity: phase === 'won' ? 1 : 0.3 }}
      />

      <div
        className="relative rounded-full overflow-hidden shadow-[0_0_80px_rgba(237,30,36,0.3),0_0_0_4px_#27272A,0_0_0_6px_#09090B]"
        style={{
          width: size, height: size,
          transform: `rotate(${rotation}deg)`,
          transition: phase === 'spinning'
            ? 'transform 5s cubic-bezier(0.15, 0.60, 0.08, 1.0)'
            : 'none',
        }}
      >
        <svg viewBox="0 0 200 200" className="w-full h-full">
          {SEGMENTS.map((seg, i) => {
            const sa = (i * SEG_ANGLE - 90) * (Math.PI / 180)
            const ea = ((i + 1) * SEG_ANGLE - 90) * (Math.PI / 180)
            const x1 = 100 + 100 * Math.cos(sa)
            const y1 = 100 + 100 * Math.sin(sa)
            const x2 = 100 + 100 * Math.cos(ea)
            const y2 = 100 + 100 * Math.sin(ea)
            const midA = ((i * SEG_ANGLE + SEG_ANGLE / 2) - 90) * (Math.PI / 180)
            const lx = 100 + 62 * Math.cos(midA)
            const ly = 100 + 62 * Math.sin(midA)
            const la = i * SEG_ANGLE + SEG_ANGLE / 2

            return (
              <g key={i}>
                <path d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`} fill={seg.color} stroke="#09090B" strokeWidth="0.5" />
                <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill={seg.text} fontSize="7.5" fontWeight={seg.color === '#ED1E24' ? '800' : '600'} fontFamily="system-ui, sans-serif" transform={`rotate(${la}, ${lx}, ${ly})`}>
                  {seg.label}
                </text>
              </g>
            )
          })}
          <circle cx="100" cy="100" r="16" fill="#09090B" stroke="#3F3F46" strokeWidth="1.5" />
          <text x="100" y="101" textAnchor="middle" dominantBaseline="middle" fill="#FAFAFA" fontSize="7" fontWeight="800" fontFamily="system-ui">BET</text>
        </svg>
      </div>
    </div>
  )
}

export default function PrizeWheel({ onClose }) {
  const [phase, setPhase] = useState('intro')
  const [rotation, setRotation] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const canvasRef = useRef(null)

  const spin = useCallback(() => {
    if (phase !== 'ready') return
    setPhase('spinning')

    const targetCenter = WINNING_INDEX * SEG_ANGLE + SEG_ANGLE / 2
    const fullSpins = 360 * (6 + Math.floor(Math.random() * 3))
    const finalRotation = fullSpins + (360 - targetCenter) + (Math.random() * 16 - 8)

    setRotation(finalRotation)

    setTimeout(() => {
      setPhase('won')
      if (canvasRef.current) confettiBurst(canvasRef.current)
      setTimeout(() => setShowResult(true), 300)
    }, 5200)
  }, [phase])

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('ready'), 400)
    const t2 = setTimeout(() => {
      if (phase === 'ready') spin()
    }, 1200)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  useEffect(() => {
    if (phase === 'ready') spin()
  }, [phase, spin])

  const modal = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center wheel-modal-bg" onClick={(e) => { if (e.target === e.currentTarget && phase === 'won') onClose?.() }}>
      {/* Confetti */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-40" />

      <div className="relative z-30 flex flex-col items-center gap-8 px-6 max-w-md w-full">
        {/* Title */}
        <div className={`text-center transition-all duration-700 ${phase === 'intro' ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'}`}>
          <p className="font-mono text-[11px] tracking-[0.22em] uppercase text-zinc-500 mb-3">
            Waitlist perk
          </p>
          <h2 className="font-display font-[900] uppercase text-[clamp(1.6rem,5vw,2.4rem)] tracking-[-0.03em] text-white leading-tight">
            Spin for your prize
          </h2>
        </div>

        {/* Wheel */}
        <div className={`transition-all duration-700 ${phase === 'intro' ? 'opacity-0 scale-90' : 'opacity-100 scale-100'}`}>
          <WheelSVG rotation={rotation} phase={phase} size={280} />
        </div>

        {/* Spinning text */}
        {phase === 'spinning' && (
          <p className="font-mono text-[13px] tracking-[0.14em] uppercase text-zinc-400 animate-pulse">
            Spinning...
          </p>
        )}

        {/* Result */}
        {showResult && (
          <div className="text-center prize-reveal">
            <p className="font-display font-[900] uppercase text-[clamp(2rem,6vw,3rem)] tracking-[-0.03em] text-white leading-tight">
              1 month free!
            </p>
            <p className="mt-3 text-[15px] text-zinc-400 leading-relaxed max-w-[32ch] mx-auto">
              Your prize will be applied automatically on launch day. Check your email for confirmation.
            </p>

            <div className="flex flex-col items-center gap-3 mt-8">
              <a
                href="https://www.tiktok.com/@betlockapp"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 rounded-full bg-white text-zinc-950 font-display font-[800] uppercase tracking-[0.02em] text-[14px] px-6 py-3.5 hover:bg-zinc-200 transition-colors"
              >
                <TikTokIcon className="w-[18px] h-[18px]" />
                Follow @betlockapp
              </a>
              <button
                onClick={onClose}
                className="font-mono text-[12px] tracking-[0.12em] uppercase text-zinc-600 hover:text-white transition-colors cursor-pointer mt-1"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return createPortal(modal, document.body)
}

function TikTokIcon({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.6a8.2 8.2 0 0 0 4.76 1.5v-3.4c-.83 0-1.65-.19-2.4-.56l-.6.55z" />
    </svg>
  )
}
