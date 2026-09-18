import { useState, useEffect, useRef } from 'react'
import { httpsCallable } from 'firebase/functions'
import { functions } from './firebase'
import AdminPanel from './AdminPanel'
import GiftPage from './GiftPage'
import LoginPage from './LoginPage'
import BlackjackDemo, { PlayingCard, LockGlyph, formatMinutes } from './BlackjackDemo'

/* ───────────────── hooks ───────────────── */

function useInView({ threshold = 0.12, once = true } = {}) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setVisible(true)
          if (once) obs.unobserve(el)
        } else if (!once) {
          setVisible(false)
        }
      },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, once])
  return [ref, visible]
}

// 0 → 1 as a tall section scrolls through its sticky viewport.
function useScrollProgress(ref) {
  const [p, setP] = useState(0)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      const span = r.height - window.innerHeight
      setP(span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0)
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [ref])
  return p
}

function useCountUp(target, run, duration = 1600) {
  const [v, setV] = useState(0)
  useEffect(() => {
    if (!run) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { setV(target); return }
    let raf
    const t0 = performance.now()
    const tick = (t) => {
      const k = Math.min(1, (t - t0) / duration)
      setV(Math.round(target * (1 - Math.pow(1 - k, 4))))
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, run, duration])
  return v
}

/* ─────────────── primitives ─────────────── */

function Reveal({ children, className = '', delay = 0 }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`} style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}

function Kicker({ children, className = '' }) {
  return (
    <p className={`font-mono text-[11px] tracking-[0.22em] uppercase ${className}`}>
      {children}
    </p>
  )
}

function Display({ as: Tag = 'h2', children, className = '' }) {
  return (
    <Tag className={`font-display font-[900] uppercase leading-[0.88] tracking-[-0.035em] ${className}`}>
      {children}
    </Tag>
  )
}

function Phone({ src, alt, width = '280px', className = '', children, style }) {
  return (
    <div className={`relative shrink-0 ${className}`} style={{ width, ...style }}>
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[-5%] w-[78%] h-[8%] rounded-[50%] blur-2xl bg-black/80 pointer-events-none"
        aria-hidden="true"
      />
      <div className="relative aspect-[9/19.5] rounded-[2.7rem] p-[3px] bg-[linear-gradient(150deg,#6b6b73_0%,#26262b_18%,#0d0d10_46%,#3a3a42_78%,#151519_100%)] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.95),0_2px_0_rgba(255,255,255,0.06)_inset]">
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-black">
          {src ? <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" /> : children}
          <div className="absolute top-[1.6%] left-1/2 -translate-x-1/2 w-[32%] h-[2.4%] bg-black rounded-full z-20" />
          <div
            className="absolute inset-0 z-10 pointer-events-none opacity-[0.5] bg-[linear-gradient(112deg,transparent_28%,rgba(255,255,255,0.09)_42%,rgba(255,255,255,0.03)_52%,transparent_62%)]"
            aria-hidden="true"
          />
          <div className="absolute inset-0 z-10 pointer-events-none rounded-[2.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]" aria-hidden="true" />
        </div>
      </div>
    </div>
  )
}

function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img src="/brand/appicon.png" alt="" className="w-[34px] h-[34px] rounded-[10px] object-cover shadow-[0_2px_10px_rgba(0,0,0,0.5)]" />
      <img src="/brand/wordmark.png" alt="Betlock" className="h-[21px] w-auto object-contain" />
    </span>
  )
}

function Chip({ label, size = 88, color = '#ED1E24', className = '', style }) {
  return (
    <div className={`chip ${className}`} style={{ '--c': color, width: size, height: size, ...style }} aria-hidden="true">
      <span style={{ fontSize: size * 0.2 }}>{label}</span>
    </div>
  )
}

function Arrow({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M7 17 17 7M8 7h9v9" />
    </svg>
  )
}

function Check({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  )
}

/* ─────────────── waitlist ─────────────── */

const joinWaitlist = httpsCallable(functions, 'joinWaitlist')

// One id per browser tab session, so the server can rate limit a session
// on top of its IP. Trivially reset by a bot — the IP and global limits are
// the real guard; this just stops one person hammering the form.
function sessionId() {
  try {
    let id = sessionStorage.getItem('bl_sid')
    if (!id) {
      id = crypto.randomUUID()
      sessionStorage.setItem('bl_sid', id)
    }
    return id
  } catch {
    return undefined
  }
}

function WaitlistForm({ tone = 'dark', id, compact = false }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const submit = async (e) => {
    e.preventDefault()
    const trimmed = email.toLowerCase().trim()
    if (!trimmed || status === 'loading' || status === 'redirecting') return
    setStatus('loading')
    try {
      const { data } = await joinWaitlist({
        email: trimmed,
        session: sessionId(),
        website: e.currentTarget.elements.website?.value || '',
      })
      // The gift lives on its own page; this ticket is what lets it open.
      try {
        sessionStorage.setItem('bl_gift', JSON.stringify({ prize: data?.prize, at: Date.now() }))
      } catch { /* private mode: the gift page falls back to a generic prize */ }
      setStatus('redirecting')
      window.location.assign('/gift')
    } catch (err) {
      setStatus(err?.code === 'functions/resource-exhausted' ? 'limited' : 'error')
    }
  }

  const onRed = tone === 'red'
  const busy = status === 'loading' || status === 'redirecting'

  return (
    <form onSubmit={submit} className="w-full max-w-[480px]">
      <div className={`flex items-center gap-1.5 rounded-full p-1.5 transition-shadow ${
        onRed
          ? 'bg-white/15 focus-within:shadow-[0_0_0_2px_rgba(255,255,255,0.9)]'
          : 'bg-surface border border-line focus-within:border-zinc-500'
      }`}>
        {/* honeypot: hidden from people, irresistible to form-filling bots */}
        <input type="text" name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] w-px h-px opacity-0" />
        <label htmlFor={id} className="sr-only">Email</label>
        <input
          id={id}
          type="email"
          required
          autoComplete="email"
          placeholder="your@email.com"
          value={email}
          readOnly={busy}
          onChange={(e) => setEmail(e.target.value)}
          className={`min-w-0 flex-1 bg-transparent pl-4 text-[16px] focus:outline-none ${
            onRed ? 'text-white placeholder-white/65' : 'text-zinc-100 placeholder-zinc-600'
          }`}
        />
        <button
          type="submit"
          disabled={busy}
          aria-busy={busy}
          className={`group shrink-0 inline-flex items-center gap-2 h-12 rounded-full pl-5 pr-4 font-display font-[800] uppercase tracking-[0.02em] text-[15px] cursor-pointer transition-all active:scale-[0.97] disabled:cursor-wait ${
            onRed ? 'bg-zinc-950 text-white hover:bg-black' : 'bg-accent text-white hover:bg-accent-hover'
          }`}
        >
          {status === 'loading' ? 'Joining' : status === 'redirecting' ? 'You’re in' : 'Join waitlist'}
          {busy
            ? <span className="w-4 h-4 rounded-full border-2 border-current border-r-transparent animate-spin" aria-hidden="true" />
            : <Arrow className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />}
        </button>
      </div>
      {status === 'error' && (
        <p className={`mt-2 pl-4 font-mono text-[12px] ${onRed ? 'text-white' : 'text-loss'}`}>Something went wrong. Try again.</p>
      )}
      {status === 'limited' && (
        <p className={`mt-2 pl-4 font-mono text-[12px] ${onRed ? 'text-white' : 'text-amber-400'}`}>Too many tries. Give it a few minutes.</p>
      )}
      {!compact && !['error', 'limited'].includes(status) && (
        <p className={`mt-3 pl-4 font-mono text-[11px] tracking-[0.06em] ${onRed ? 'text-white/80' : 'text-zinc-500'}`}>
          Join the waitlist to unlock a <span className={onRed ? 'text-white' : 'text-zinc-200'}>gift</span>.
        </p>
      )}
    </form>
  )
}

/* ─────────────── faq ─────────────── */

function FAQItem({ n, q, a }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const [h, setH] = useState(0)
  useEffect(() => { if (ref.current) setH(ref.current.scrollHeight) }, [a])

  return (
    <div className="border-t border-line">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="w-full flex items-center gap-5 sm:gap-8 py-6 text-left cursor-pointer group"
      >
        <span className="font-mono text-[11px] text-zinc-600 shrink-0">{n}</span>
        <span className="flex-1 text-[17px] sm:text-[20px] font-medium text-zinc-200 group-hover:text-white transition-colors">{q}</span>
        <span className={`grid place-items-center w-9 h-9 rounded-full shrink-0 transition-all duration-300 ${open ? 'bg-accent text-white rotate-45' : 'bg-card text-zinc-400'}`}>
          <svg viewBox="0 0 24 24" className="w-4 h-4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      </button>
      <div className="overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]" style={{ maxHeight: open ? h : 0 }}>
        <p ref={ref} className="text-[15px] sm:text-[16px] text-zinc-400 leading-relaxed pb-7 sm:pl-[60px] pr-12 max-w-2xl">{a}</p>
      </div>
    </div>
  )
}

/* ─────────────── roulette wheel ─────────────── */

const WHEEL = [0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23, 10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26]
const REDS = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36])

// Idles slowly, and picks up speed while the page is being scrolled.
function RouletteWheel({ className = '' }) {
  const ref = useRef(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let raf = 0
    let angle = 0
    let last = performance.now()
    let lastY = window.scrollY
    let boost = 0
    const loop = (t) => {
      const dt = Math.min(64, t - last)
      last = t
      const y = window.scrollY
      boost = boost * 0.92 + Math.abs(y - lastY) * 0.06
      lastY = y
      angle = (angle + dt * (0.012 + boost * 0.01)) % 360
      if (ref.current) ref.current.style.transform = `rotate(${angle}deg)`
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [])

  const seg = 360 / WHEEL.length
  const C = 250
  const inner = 180
  const pt = (rad, deg) => {
    const a = ((deg - 90) * Math.PI) / 180
    return [C + rad * Math.cos(a), C + rad * Math.sin(a)]
  }

  return (
    <svg viewBox="0 0 500 500" className={className} aria-hidden="true">
      <circle cx="250" cy="250" r="249" fill="#141417" />
      <g ref={ref} style={{ transformOrigin: '250px 250px' }}>
        {WHEEL.map((n, i) => {
          const a0 = i * seg
          const a1 = a0 + seg
          const [x0, y0] = pt(236, a0)
          const [x1, y1] = pt(236, a1)
          const [x2, y2] = pt(inner, a1)
          const [x3, y3] = pt(inner, a0)
          const fill = n === 0 ? '#16A34A' : REDS.has(n) ? '#ED1E24' : '#0B0B0D'
          const [tx, ty] = pt(214, a0 + seg / 2)
          return (
            <g key={n}>
              <path d={`M${x0} ${y0} A236 236 0 0 1 ${x1} ${y1} L${x2} ${y2} A${inner} ${inner} 0 0 0 ${x3} ${y3}Z`} fill={fill} stroke="#2a2a30" strokeWidth="1" />
              <text x={tx} y={ty} fill="#fff" fontSize="15" fontWeight="700" fontFamily="Satoshi, sans-serif" textAnchor="middle" dominantBaseline="central" transform={`rotate(${a0 + seg / 2} ${tx} ${ty})`}>
                {n}
              </text>
            </g>
          )
        })}
        <circle cx="250" cy="250" r={inner} fill="#0E0E11" stroke="#2a2a30" />
        <circle cx="250" cy="250" r="120" fill="none" stroke="#1E1E23" strokeWidth="2" />
        {Array.from({ length: 8 }).map((_, i) => {
          const [x, y] = pt(120, i * 45)
          return <line key={i} x1="250" y1="250" x2={x} y2={y} stroke="#2a2a30" strokeWidth="6" strokeLinecap="round" />
        })}
        <circle cx="250" cy="250" r="34" fill="#ED1E24" />
        <circle cx="250" cy="250" r="12" fill="#0E0E11" />
      </g>
      <circle cx="250" cy="22" r="9" fill="#FAFAFA" />
    </svg>
  )
}

/* ─────────────── content ─────────────── */

const failures = [
  ['You planted a tree in a focus app.', 'Then you killed the tree.'],
  ['You set a screen time limit.', 'Then you tapped “Ignore Limit.”'],
  ['You deleted Instagram on Sunday.', 'You reinstalled it Tuesday.'],
]

const steps = [
  {
    n: '01',
    t: 'Your minutes become chips',
    d: 'Every minute of screen time is currency. Pick how many you’re willing to put on the table.',
    tone: 'bg-zinc-50 text-zinc-950',
    sub: 'text-zinc-600',
  },
  {
    n: '02',
    t: 'You play a real hand',
    d: 'Blackjack. Roulette. Actual odds, actual tension. Win and your balance climbs. Lose and it drops.',
    tone: 'bg-accent text-white',
    sub: 'text-white/90',
  },
  {
    n: '03',
    t: 'The house collects',
    d: 'Run your balance to zero and the apps you chose stop opening. No streak to guilt you. A lock.',
    tone: 'bg-card text-zinc-50 border border-zinc-700/60',
    sub: 'text-zinc-400',
  },
]

// [name, logo in /public/apps, tile background, keep the logo's own colour]
const apps = [
  ['Instagram', 'instagram', 'radial-gradient(circle at 30% 107%, #fdf497 0%, #fd5949 45%, #d6249f 60%, #285AEB 90%)'],
  ['TikTok', 'tiktok', '#000'],
  ['YouTube', 'youtube', '#FF0000'],
  ['X', 'x', '#000'],
  ['Snapchat', 'snapchat', '#FFFC00', true],
  ['Netflix', 'netflix', '#000', true],
  ['Reddit', 'reddit', '#FF4500'],
  ['Twitch', 'twitch', '#9146FF'],
  ['Discord', 'discord', '#5865F2'],
  ['Threads', 'threads', '#000'],
  ['Spotify', 'spotify', '#1DB954'],
  ['WhatsApp', 'whatsapp', '#25D366'],
]

const losses = [
  { at: 0.14, t: 'Blackjack · dealer 20', m: 30 },
  { at: 0.3, t: 'Roulette · red', m: 60 },
  { at: 0.44, t: 'Blackjack · bust', m: 30 },
  { at: 0.58, t: 'Roulette · 17', m: 120 },
]

const faqs = [
  ['01', 'Does it actually lock my phone?', 'Yes. BETLOCK uses Apple’s Screen Time API to block the apps you pick. At zero balance a real block screen appears. It is not an honor system.'],
  ['02', 'Is this gambling? Is it legal?', 'No money is wagered. You bet minutes, not pesos. No gaming licence required, and nothing to lose but time you were going to lose anyway.'],
  ['03', 'Can I just turn it off?', 'You can revoke the permission in Settings. You can also walk out of the gym. The product only works on people who want the stakes.'],
  ['04', 'Android?', 'Not yet. Android has no equivalent blocking API. iOS 17 and up for now.'],
  ['05', 'Can I go negative?', 'Yes. A negative balance carries into tomorrow. Every morning you get a base balance so there is always a way back.'],
  ['06', 'What does it cost?', '$4.99 a month. Join the waitlist before launch and you unlock a gift.'],
  ['07', 'Can I cancel?', 'Any time, from Settings → Subscriptions on your iPhone. No retention flow, no phone call.'],
]

const ticker = ['Blackjack pays 3:2', 'Roulette up to 35:1', 'Real app lock', 'Join the waitlist', 'Dealer stands on 17', 'Made in Monterrey']

/* ─────────────── sections ─────────────── */

function Marquee({ items, className = '', reverse = false }) {
  const row = (
    <div className="flex shrink-0 items-center">
      {items.map((t, i) => (
        <span key={i} className="flex items-center">
          <span className="px-6 sm:px-8 whitespace-nowrap">{t}</span>
          <span className="opacity-70">{['♠', '♥', '♦', '♣'][i % 4]}</span>
        </span>
      ))}
    </div>
  )
  return (
    <div className={`overflow-hidden ${className}`} aria-hidden="true">
      <div className={`marquee flex w-max ${reverse ? 'marquee--rev' : ''}`}>
        {row}{row}{row}{row}
      </div>
    </div>
  )
}

function Hero({ heroRef }) {
  const stage = useRef(null)
  const onMove = (e) => {
    const el = stage.current
    if (!el || e.pointerType === 'touch') return
    el.style.setProperty('--mx', (e.clientX / window.innerWidth - 0.5).toFixed(3))
    el.style.setProperty('--my', (e.clientY / window.innerHeight - 0.5).toFixed(3))
  }

  return (
    <header ref={heroRef} onPointerMove={onMove} className="hero-field relative overflow-hidden pt-[76px]">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10">
        <div className="grid lg:grid-cols-12 gap-y-16 items-center min-h-[calc(100svh-76px)] py-10 lg:py-16">
          <div className="lg:col-span-7 relative z-10">
            <div className="h-kicker inline-flex items-center gap-2.5 rounded-full border border-line bg-surface/70 px-3.5 py-2 font-mono text-[10.5px] tracking-[0.2em] uppercase text-zinc-400">
              <span className="live-dot" /> Screentime casino · iOS · Launching soon
            </div>

            <Display as="h1" className="h-title mt-7 text-[clamp(3.1rem,7.6vw,7.4rem)]">
              Your
              <br />
              screentime
              <br />
              is your <span className="text-accent bet-word">bet.</span>
            </Display>

            <p className="h-sub mt-7 text-[clamp(1.05rem,1.5vw,1.3rem)] text-zinc-400 leading-relaxed max-w-[36ch]">
              Play blackjack with the hours you were going to waste. <span className="text-zinc-100">Win them back, or watch your phone lock.</span>
            </p>

            <div className="h-cta mt-9">
              <WaitlistForm id="email-hero" />
            </div>

            <div className="h-note mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[11px] tracking-[0.14em] uppercase text-zinc-500">
              <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-win" /> Free to join</span>
              <span className="inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-win" /> Gift for early members</span>
              <a href="#play" className="inline-flex items-center gap-1.5 text-zinc-300 hover:text-white ul-link">Try a hand first ↓</a>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end pb-8 lg:pb-0">
            <div ref={stage} className="h-phone hero-stage relative">
              <div className="par absolute z-20 -left-[24%] top-[5%]" style={{ '--d': 38 }}>
                <div className="float-a" style={{ '--r': '-14deg' }}>
                  <PlayingCard card={{ r: 'A', s: '♠' }} className="pcard--hero" />
                </div>
              </div>
              <div className="par absolute z-0 -right-[16%] -top-[4%]" style={{ '--d': 18 }}>
                <div className="float-b" style={{ '--r': '16deg' }}>
                  <PlayingCard card={{ r: 'K', s: '♥' }} className="pcard--hero" />
                </div>
              </div>

              <div className="par relative z-10" style={{ '--d': 10 }}>
                <Phone
                  src="/screenshots/home.png"
                  alt="BETLOCK home screen showing 4 hours available today"
                  width="clamp(230px, 62vw, 300px)"
                  style={{ transform: 'rotate(-3deg)' }}
                />
              </div>

              <div className="par absolute z-20 -right-[14%] top-[30%]" style={{ '--d': 30 }}>
                <div className="float-b sticker bg-win text-zinc-950" style={{ '--r': '6deg' }}>Won · +30m</div>
              </div>
              <div className="par absolute z-20 -left-[18%] bottom-[26%]" style={{ '--d': 26 }}>
                <div className="float-a sticker bg-accent text-white" style={{ '--r': '-7deg' }}>Lost · −60m</div>
              </div>

              <div className="par absolute z-20 -right-[10%] bottom-[6%]" style={{ '--d': 44 }}>
                <div className="float-a" style={{ '--r': '12deg' }}>
                  <Chip label="30" size={92} />
                </div>
              </div>
              <div className="par absolute z-0 -right-[24%] bottom-[22%] hidden sm:block" style={{ '--d': 20 }}>
                <div className="float-b" style={{ '--r': '-10deg' }}>
                  <Chip label="60" size={64} color="#26262B" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}

function Problem() {
  const [ref, visible] = useInView({ threshold: 0.4 })
  const mins = useCountUp(270, visible)
  const days = useCountUp(68, visible, 2000)
  return (
    <section className="py-24 sm:py-32">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10">
        <Reveal>
          <Kicker className="text-zinc-500 mb-10">01 — The problem</Kicker>
        </Reveal>
        <div ref={ref} className="grid lg:grid-cols-12 gap-y-8 gap-x-10 items-end">
          <div className="lg:col-span-8">
            <p className="font-display font-[900] leading-[0.8] tracking-[-0.05em] text-[clamp(5rem,17vw,13rem)] text-zinc-50 tabular-nums" aria-label="4 hours 30 minutes">
              {Math.floor(mins / 60)}<span className="text-zinc-600">h</span>{String(mins % 60).padStart(2, '0')}<span className="text-zinc-600">m</span>
            </p>
          </div>
          <div className="lg:col-span-4 lg:pb-5">
            <p className="text-[clamp(1.05rem,1.5vw,1.25rem)] text-zinc-400 leading-relaxed max-w-[34ch]">
              The average day on a phone in Mexico. That’s{' '}
              <span className="inline-block rounded-md bg-accent px-2 py-0.5 text-white font-semibold tabular-nums">{days} days a year</span>{' '}
              — gone, in four-minute pieces you never decided to spend.
            </p>
          </div>
        </div>

        <div className="mt-20 sm:mt-28">
          <Reveal>
            <Kicker className="text-zinc-500 mb-6">02 — Why nothing worked</Kicker>
          </Reveal>
          {failures.map(([a, b], i) => (
            <Reveal key={i} delay={i * 90}>
              <div className="border-t border-line py-7 sm:py-9 grid sm:grid-cols-12 gap-x-6 gap-y-1 items-baseline">
                <span className="hidden sm:block sm:col-span-1 font-mono text-[12px] text-zinc-600">0{i + 1}</span>
                <p className="sm:col-span-11 text-[clamp(1.35rem,3.2vw,2.4rem)] font-[600] leading-[1.2] tracking-[-0.02em]">
                  <span className="text-zinc-300">{a}</span>{' '}
                  <span className="strike text-zinc-500">{b}</span>
                </p>
              </div>
            </Reveal>
          ))}
          <Reveal>
            <div className="border-t border-line pt-9">
              <p className="text-[clamp(1.15rem,2vw,1.6rem)] text-zinc-100 font-medium max-w-[40ch] leading-snug">
                None of them ever cost you anything. <span className="text-accent">That was the whole problem.</span>
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  return (
    <section className="py-24 sm:py-32 border-t border-line bg-surface">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12 sm:mb-16">
          <Reveal>
            <Kicker className="text-accent mb-6">03 — The mechanic</Kicker>
            <Display className="text-[clamp(2.5rem,6.4vw,5.4rem)] max-w-[13ch]">
              So we gave your time a price.
            </Display>
          </Reveal>
          <Reveal>
            <p className="text-zinc-400 text-[16px] leading-relaxed max-w-[34ch] lg:pb-3">
              Three rules. No willpower required — the house does the enforcing.
            </p>
          </Reveal>
        </div>

        <div className="snap-row -mx-5 px-5 sm:mx-0 sm:px-0 flex lg:grid lg:grid-cols-3 gap-4 overflow-x-auto lg:overflow-visible snap-x snap-mandatory pb-2">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 110} className="snap-start shrink-0 w-[84%] sm:w-[60%] lg:w-auto">
              <article className={`group relative h-full min-h-[440px] rounded-[28px] p-7 sm:p-8 flex flex-col overflow-hidden ${s.tone}`}>
                <div className="flex items-start justify-between">
                  <span className="font-mono text-[13px] tracking-[0.1em]">{s.n}</span>
                  <span className="grid place-items-center w-11 h-11 rounded-full border border-current/25">
                    <Arrow className="w-5 h-5 transition-transform duration-500 group-hover:rotate-45" />
                  </span>
                </div>

                <div className="flex-1 grid place-items-center py-8">
                  {i === 0 && (
                    <div className="relative h-[120px] w-[170px]">
                      <Chip label="15" size={74} color="#26262B" className="absolute left-0 top-8 step-chip" style={{ '--r': '-12deg' }} />
                      <Chip label="30" size={86} className="absolute left-[44px] top-0 step-chip" style={{ '--r': '8deg' }} />
                      <Chip label="60" size={70} color="#16A34A" className="absolute right-0 top-10 step-chip" style={{ '--r': '18deg' }} />
                    </div>
                  )}
                  {i === 1 && (
                    <div className="relative h-[130px] w-[170px]">
                      <div className="absolute left-2 top-2 step-card-a"><PlayingCard card={{ r: 'A', s: '♠' }} className="pcard--step" /></div>
                      <div className="absolute left-[68px] top-4 step-card-b"><PlayingCard card={{ r: 'K', s: '♦' }} className="pcard--step" /></div>
                    </div>
                  )}
                  {i === 2 && (
                    <div className="relative grid place-items-center w-[124px] h-[124px] rounded-[30px] bg-accent text-white step-lock">
                      <LockGlyph className="w-14 h-14" />
                    </div>
                  )}
                </div>

                <h3 className="font-display font-[900] uppercase leading-[0.92] tracking-[-0.025em] text-[clamp(1.7rem,2.6vw,2.2rem)] max-w-[12ch]">
                  {s.t}
                </h3>
                <p className={`mt-4 text-[15.5px] leading-relaxed ${s.sub}`}>{s.d}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function PlaySection() {
  return (
    <section id="play" className="relative py-24 sm:py-32 border-t border-line overflow-hidden scroll-mt-16">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10 grid lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        <div className="lg:col-span-5">
          <Reveal>
            <Kicker className="text-accent mb-6 inline-flex items-center gap-2.5"><span className="live-dot" /> 04 — Live table</Kicker>
            <Display className="text-[clamp(2.6rem,6.4vw,5.2rem)]">
              Try a hand.
              <br />
              <span className="text-zinc-600">Right here.</span>
            </Display>
          </Reveal>
          <Reveal delay={120}>
            <p className="mt-7 text-[clamp(1.02rem,1.4vw,1.2rem)] text-zinc-400 leading-relaxed max-w-[38ch]">
              You start with four hours. Every hand costs real minutes. See how long it takes the house to lock you out.
            </p>
          </Reveal>
          <Reveal delay={200}>
            <ul className="mt-9 grid grid-cols-3 gap-2 max-w-[440px]">
              {[['3:2', 'Blackjack pays'], ['17', 'Dealer stands'], ['0h', 'Means locked']].map(([big, small]) => (
                <li key={small} className="rounded-2xl border border-line bg-surface p-4">
                  <p className="font-display font-[900] text-[28px] leading-none tracking-[-0.02em]">{big}</p>
                  <p className="mt-2 font-mono text-[10px] tracking-[0.14em] uppercase text-zinc-500">{small}</p>
                </li>
              ))}
            </ul>
          </Reveal>
        </div>
        <Reveal className="lg:col-span-7" delay={100}>
          <BlackjackDemo lockedSlot={<WaitlistForm id="email-locked" tone="red" compact />} />
        </Reveal>
      </div>
    </section>
  )
}

function Stakes() {
  const ref = useRef(null)
  const p = useScrollProgress(ref)
  const drain = Math.min(1, p / 0.7)
  const mins = Math.max(0, Math.round(240 * (1 - drain)))
  const locked = p >= 0.7
  const shown = losses.filter((l) => p >= l.at)

  return (
    <section ref={ref} className="relative h-[300vh]" aria-label="What happens when you hit zero">
      <div className={`sticky top-0 h-[100svh] overflow-hidden transition-colors duration-700 ${locked ? 'bg-accent' : 'bg-bg'}`}>
        <div className="max-w-[1320px] mx-auto h-full px-5 sm:px-10 grid lg:grid-cols-12 gap-x-10 content-center items-center">
          <div className="lg:col-span-7 relative z-10">
            <Kicker className={`mb-5 transition-colors ${locked ? 'text-white/85' : 'text-zinc-500'}`}>05 — The stakes</Kicker>
            <Display className="text-[clamp(2.2rem,6.4vw,5.8rem)] max-w-[14ch]">
              {locked ? (
                <>Hit zero. Your apps <span className="text-zinc-950">stop opening.</span></>
              ) : (
                <>Every loss costs <span className="text-accent">real minutes.</span></>
              )}
            </Display>

            <div className="mt-6 sm:mt-10 max-w-[460px]">
              <div className="flex items-baseline justify-between">
                <span className={`font-mono text-[11px] tracking-[0.18em] uppercase ${locked ? 'text-white/85' : 'text-zinc-500'}`}>Balance</span>
                <span className="font-display font-[900] text-[clamp(1.6rem,3vw,2.2rem)] tabular-nums tracking-[-0.02em]">{formatMinutes(mins)}</span>
              </div>
              <div className={`mt-3 h-[6px] rounded-full overflow-hidden ${locked ? 'bg-white/25' : 'bg-line'}`}>
                <div className={`h-full rounded-full ${mins < 60 ? 'bg-accent' : 'bg-zinc-100'}`} style={{ width: `${(mins / 240) * 100}%` }} />
              </div>
              <ul className="hidden sm:block mt-6 space-y-2 min-h-[150px]">
                {shown.map((l) => (
                  <li key={l.t} className="verdict flex items-center justify-between font-mono text-[12px] tracking-[0.08em] uppercase">
                    <span className={locked ? 'text-white/90' : 'text-zinc-400'}>{l.t}</span>
                    <span className={locked ? 'text-white' : 'text-accent'}>−{l.m}m</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="lg:col-span-5 flex justify-center lg:justify-end mt-8 lg:mt-0">
            <Phone width="clamp(180px, 42vw, 290px)" style={{ transform: `rotate(${locked ? 0 : 3}deg)`, transition: 'transform .8s cubic-bezier(.16,1,.3,1)' }}>
              <div className="absolute inset-0 bg-[#0a0a0c] pt-[16%] px-[7%]">
                <div className="flex items-center justify-between font-mono text-[9px] text-zinc-400">
                  <span>Screen Time</span>
                  <span className={mins < 60 ? 'text-accent' : 'text-zinc-200'}>{formatMinutes(mins)}</span>
                </div>
                <div className="mt-[10%] grid grid-cols-3 gap-x-[9%] gap-y-[6%]">
                  {apps.map(([name, file, bg, dark]) => (
                    <div key={name} className="flex flex-col items-center gap-1">
                      <div
                        className="relative w-full aspect-square rounded-[24%] grid place-items-center overflow-hidden transition-all duration-500 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]"
                        style={{ background: locked ? '#26262b' : bg }}
                      >
                        <img
                          src={`/apps/${file}.svg`}
                          alt=""
                          className={`w-[52%] h-[52%] transition-all duration-500 ${locked ? 'opacity-20' : ''}`}
                          style={{ filter: dark && !locked ? 'none' : 'brightness(0) invert(1)' }}
                        />
                        {locked && <LockGlyph className="absolute w-[42%] h-[42%] text-zinc-200 lock-pop" />}
                      </div>
                      <span className="text-[7.5px] sm:text-[8.5px] text-zinc-400 truncate max-w-full">{name}</span>
                    </div>
                  ))}
                </div>
              </div>
              {locked && (
                <div className="lock-in absolute inset-x-[6%] bottom-[5%] z-20 rounded-[22px] bg-accent text-white p-[7%]">
                  <div className="flex items-center gap-2">
                    <LockGlyph className="w-4 h-4" />
                    <span className="font-mono text-[9px] tracking-[0.16em] uppercase">Locked by Betlock</span>
                  </div>
                  <p className="mt-2 font-display font-[900] uppercase leading-[0.92] text-[clamp(14px,3vw,21px)]">Win it back or wait for tomorrow.</p>
                </div>
              )}
            </Phone>
          </div>
        </div>

        <div className={`absolute left-0 bottom-0 h-[3px] ${locked ? 'bg-white' : 'bg-accent'}`} style={{ width: `${p * 100}%` }} />
      </div>
    </section>
  )
}

function Games() {
  return (
    <section className="relative py-24 sm:py-36 border-t border-line overflow-hidden">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10 grid lg:grid-cols-12 gap-14 items-center">
        <div className="lg:col-span-5 relative z-10">
          <Reveal>
            <Kicker className="text-zinc-500 mb-6">06 — The floor</Kicker>
            <Display className="text-[clamp(2.5rem,6vw,5rem)]">
              Real games.
              <br />
              <span className="text-accent">Real odds.</span>
            </Display>
            <p className="mt-7 text-[clamp(1rem,1.4vw,1.18rem)] text-zinc-400 leading-relaxed max-w-[38ch]">
              Not a metaphor for a casino — a casino. The dealer stands on all 17s. The wheel doesn’t care that you have a deadline.
            </p>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-10 space-y-2 max-w-[440px]">
              {[
                ['Blackjack', 'Beat the dealer without busting', 'Pays 3:2'],
                ['Roulette', 'Red, black or a number', 'Up to 35:1'],
                ['More tables', 'Coming after launch', 'Soon'],
              ].map(([name, desc, pay], i) => (
                <div key={name} className={`flex items-center justify-between gap-4 rounded-2xl px-5 py-4 ${i === 2 ? 'border border-dashed border-zinc-700' : 'bg-surface border border-line'}`}>
                  <div>
                    <p className={`font-display font-[800] uppercase text-[18px] tracking-[-0.01em] ${i === 2 ? 'text-zinc-500' : ''}`}>{name}</p>
                    <p className="text-[13.5px] text-zinc-500">{desc}</p>
                  </div>
                  <span className={`shrink-0 font-mono text-[11px] tracking-[0.1em] uppercase rounded-full px-3 py-1.5 ${i === 2 ? 'text-zinc-500 bg-card' : 'text-accent bg-accent/10'}`}>{pay}</span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>

        <div className="lg:col-span-7 relative flex justify-center min-h-[460px] sm:min-h-[600px] items-center">
          <RouletteWheel className="absolute w-[min(640px,130vw)] max-w-none left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="relative z-10 flex gap-4 sm:gap-6 items-center">
            <Reveal>
              <div className="translate-y-8">
                <Phone src="/screenshots/blackjack.png" alt="BETLOCK blackjack table with a 30 minute wager" width="clamp(136px, 36vw, 232px)" style={{ transform: 'rotate(-5deg)' }} />
              </div>
            </Reveal>
            <Reveal delay={140}>
              <div className="-translate-y-8">
                <Phone src="/screenshots/roulette.png" alt="BETLOCK live roulette wheel and betting grid" width="clamp(136px, 36vw, 232px)" style={{ transform: 'rotate(5deg)' }} />
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  const features = ['Blackjack & roulette', 'Real app blocking via Screen Time', 'Balance, history & 7-day chart', 'Streaks & multipliers']
  return (
    <section id="pricing" className="py-24 sm:py-32 border-t border-line bg-surface scroll-mt-16">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10">
        <div className="text-center">
          <Reveal>
            <Kicker className="text-zinc-500 mb-6">07 — The price</Kicker>
            <Display className="text-[clamp(2.2rem,5.6vw,4.6rem)] max-w-[17ch] mx-auto">
              Cheaper than the coffee that keeps you up <span className="text-accent">scrolling.</span>
            </Display>
          </Reveal>
        </div>

        <Reveal delay={120}>
          <div className="mt-12 mx-auto max-w-[920px] grid md:grid-cols-5 gap-3">
            <div className="relative md:col-span-3 rounded-[28px] bg-accent text-white p-7 sm:p-9 overflow-hidden">
              <span className="sticker absolute top-6 right-6 bg-zinc-50 text-zinc-950" style={{ '--r': '6deg' }}>
                Waitlist gift
              </span>
              <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-white/90">Betlock Pro</p>
              <p className="mt-5 font-display font-[900] tracking-[-0.04em] leading-none text-[clamp(4rem,10vw,6.4rem)]">
                $4.99
                <span className="font-mono font-normal text-[15px] tracking-normal text-white/90 ml-2">/month</span>
              </p>
              <p className="mt-3 font-mono text-[12px] tracking-[0.08em] text-white/90">
                About 17¢ a day · cancel any time
              </p>
              <a
                href="#access"
                className="group mt-9 flex items-center justify-between h-16 rounded-2xl bg-zinc-950 hover:bg-black px-6 font-display font-[800] uppercase text-[18px] tracking-[0.01em] transition-colors"
              >
                Join the waitlist
                <Arrow className="w-5 h-5 transition-transform duration-300 group-hover:rotate-45" />
              </a>
            </div>

            <div className="md:col-span-2 rounded-[28px] bg-bg border border-line p-7 sm:p-9 flex flex-col">
              <p className="font-mono text-[12px] tracking-[0.16em] uppercase text-zinc-500">Everything included</p>
              <ul className="mt-6 space-y-4 flex-1">
                {features.map((f) => (
                  <li key={f} className="flex items-start gap-3 text-[15.5px] text-zinc-200">
                    <span className="mt-0.5 grid place-items-center w-5 h-5 rounded-full bg-win/15 text-win shrink-0"><Check className="w-3 h-3" /></span>
                    {f}
                  </li>
                ))}
              </ul>
              <p className="mt-8 pt-6 border-t border-line font-mono text-[11px] tracking-[0.12em] uppercase text-zinc-500">
                Join the waitlist to get a <span className="text-accent">gift</span>
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FAQ() {
  return (
    <section id="faq" className="py-24 sm:py-32 border-t border-line scroll-mt-16">
      <div className="max-w-[1320px] mx-auto px-5 sm:px-10 grid lg:grid-cols-12 gap-12">
        <Reveal className="lg:col-span-4">
          <Kicker className="text-zinc-500 mb-6">08 — Questions</Kicker>
          <Display className="text-[clamp(2.2rem,4.4vw,3.6rem)] max-w-[10ch]">Before you ask.</Display>
          <p className="mt-6 text-zinc-500 text-[15px] leading-relaxed max-w-[30ch]">
            Something else? <a href="mailto:hello@betlock.app" className="text-zinc-200 ul-link">hello@betlock.app</a>
          </p>
        </Reveal>
        <Reveal className="lg:col-span-8" delay={100}>
          <div className="border-b border-line">
            {faqs.map(([n, q, a]) => <FAQItem key={n} n={n} q={q} a={a} />)}
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function FinalCTA({ accessRef }) {
  return (
    <section id="access" ref={accessRef} className="px-3 sm:px-6 pb-3 sm:pb-6 scroll-mt-20">
      <div className="relative rounded-[32px] sm:rounded-[40px] bg-accent text-white overflow-hidden">
        <Marquee items={ticker} className="border-b border-white/20 py-3.5 font-mono text-[11px] tracking-[0.2em] uppercase text-white/90" />
        <div className="relative max-w-[1320px] mx-auto px-6 sm:px-10 py-20 sm:py-28">
          <Chip label="120" size={150} color="#0E0E11" className="absolute right-[-40px] top-10 hidden md:flex spin-slow" />
          <Reveal>
            <Display className="text-[clamp(3rem,10vw,9rem)] max-w-[11ch] leading-[0.84]">
              Put your hours on the table.
            </Display>
          </Reveal>
          <Reveal delay={120}>
            <div className="mt-12 grid lg:grid-cols-12 gap-8 items-end">
              <div className="lg:col-span-7">
                <WaitlistForm id="email-final" tone="red" />
              </div>
              <p className="lg:col-span-5 font-mono text-[11px] tracking-[0.16em] uppercase text-white/90 lg:text-right lg:pb-10">
                iPhone · iOS 17+ · Launching soon
              </p>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  )
}

/* ─────────────── landing ─────────────── */

function Landing() {
  const [scrolled, setScrolled] = useState(false)
  const [heroRef, heroVisible] = useInView({ threshold: 0.05, once: false })
  const [accessRef, accessVisible] = useInView({ threshold: 0.05, once: false })

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const showDock = !heroVisible && !accessVisible

  return (
    <div className="grain bg-bg text-zinc-50 font-sans antialiased overflow-x-clip">
      {/* ── NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${scrolled ? 'bg-bg/80 backdrop-blur-xl border-b border-line' : 'border-b border-transparent'}`}>
        <div className="max-w-[1320px] mx-auto flex items-center justify-between gap-6 px-5 sm:px-10 h-[76px]">
          <a href="/" aria-label="BETLOCK home"><Logo /></a>
          <div className="hidden md:flex items-center rounded-full border border-line bg-surface/60 p-1 font-mono text-[11px] tracking-[0.16em] uppercase">
            {[['#play', 'Play a hand'], ['#pricing', 'Price'], ['#faq', 'FAQ']].map(([href, label]) => (
              <a key={href} href={href} className="px-4 py-2 rounded-full text-zinc-400 hover:text-white hover:bg-card transition-colors">{label}</a>
            ))}
          </div>
          <a
            href="#access"
            className={`group inline-flex items-center gap-2 h-11 rounded-full px-5 font-display font-[800] uppercase text-[14px] tracking-[0.02em] transition-colors ${
              scrolled ? 'bg-accent text-white hover:bg-accent-hover' : 'bg-zinc-50 text-zinc-950 hover:bg-white'
            }`}
          >
            Join waitlist
            <Arrow className="w-4 h-4 transition-transform duration-300 group-hover:rotate-45" />
          </a>
        </div>
      </nav>

      <Hero heroRef={heroRef} />

      <div className="relative py-8 sm:py-12 overflow-hidden">
        <Marquee items={ticker} className="-rotate-2 scale-[1.04] bg-accent text-white py-4 font-display font-[900] uppercase text-[clamp(1.4rem,3vw,2.2rem)] tracking-[-0.01em]" />
        <Marquee items={['Win it back', 'Lose and it locks', 'Bet minutes, not pesos', 'The house always collects']} reverse className="rotate-[1.5deg] scale-[1.04] -mt-2 bg-zinc-50 text-zinc-950 py-3 font-mono text-[12px] tracking-[0.2em] uppercase" />
      </div>

      <Problem />
      <HowItWorks />
      <PlaySection />
      <Stakes />
      <Games />
      <Pricing />
      <FAQ />
      <FinalCTA accessRef={accessRef} />

      {/* ── FOOTER ── */}
      <footer className="py-12 pb-28 md:pb-12">
        <div className="max-w-[1320px] mx-auto px-5 sm:px-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <Logo />
            <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] tracking-[0.14em] uppercase text-zinc-500">
              <a href="/privacy" className="hover:text-zinc-200 ul-link transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-zinc-200 ul-link transition-colors">Terms</a>
              <a href="mailto:hello@betlock.app" className="hover:text-zinc-200 ul-link transition-colors">Contact</a>
              <a href="#" className="hover:text-zinc-200 ul-link transition-colors">Instagram</a>
              <a href="#" className="hover:text-zinc-200 ul-link transition-colors">TikTok</a>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] tracking-[0.1em] uppercase text-zinc-600">
            <p>Made in Monterrey</p>
            <p>© 2026 BETLOCK</p>
          </div>
        </div>
      </footer>

      {/* ── MOBILE DOCK ── */}
      <div className={`md:hidden fixed inset-x-3 bottom-3 z-50 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${showDock ? 'translate-y-0 opacity-100' : 'translate-y-[140%] opacity-0 pointer-events-none'}`}>
        <a
          href="#access"
          className="flex items-center justify-between h-[60px] rounded-full bg-accent text-white pl-6 pr-2 shadow-[0_18px_40px_-12px_rgba(237,30,36,0.55)]"
        >
          <span className="font-display font-[800] uppercase text-[16px] tracking-[0.01em]">Join the waitlist</span>
          <span className="grid place-items-center w-11 h-11 rounded-full bg-zinc-950"><Arrow className="w-4 h-4" /></span>
        </a>
      </div>
    </div>
  )
}

/* ─────────────── router ─────────────── */

export default function App() {
  const [route, setRoute] = useState(window.location.hash)
  useEffect(() => {
    const onHash = () => setRoute(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  if (route === '#admin') return <AdminPanel />
  if (route === '#login') return <LoginPage />
  if (window.location.pathname.replace(/\/$/, '') === '/gift') return <GiftPage />
  return <Landing />
}
