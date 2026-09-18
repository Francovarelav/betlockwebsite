import { useState, useEffect, useRef } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'
import AdminPanel from './AdminPanel'

/* ───────────────── hooks ───────────────── */

function useInView(threshold = 0.12) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.unobserve(el) } },
      { threshold },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible]
}

/* ─────────────── primitives ─────────────── */

function Reveal({ children, className = '' }) {
  const [ref, visible] = useInView()
  return (
    <div ref={ref} className={`reveal ${visible ? 'visible' : ''} ${className}`}>
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

function Phone({ src, alt, width = '280px', tilt = 0, depth = null, className = '' }) {
  // `depth` turns the flat card into an object in space: a real perspective
  // transform, an edge highlight where light would catch the rail, and a
  // ground shadow so it is standing somewhere rather than floating.
  const transform = depth
    ? `perspective(1800px) rotateY(${depth.y ?? 0}deg) rotateX(${depth.x ?? 0}deg) rotate(${tilt}deg)`
    : tilt
      ? `rotate(${tilt}deg)`
      : undefined

  return (
    <div className={`relative shrink-0 ${className}`} style={{ width, transform }}>
      {/* ground shadow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 bottom-[-6%] w-[78%] h-[9%] rounded-[50%] blur-2xl bg-black/80 pointer-events-none"
        aria-hidden="true"
      />

      {/* titanium rail */}
      <div className="relative aspect-[9/19.5] rounded-[2.7rem] p-[3px] bg-[linear-gradient(150deg,#6b6b73_0%,#26262b_18%,#0d0d10_46%,#3a3a42_78%,#151519_100%)] shadow-[0_40px_90px_-24px_rgba(0,0,0,0.95),0_2px_0_rgba(255,255,255,0.06)_inset]">
        <div className="relative w-full h-full rounded-[2.5rem] overflow-hidden bg-black">
          <img src={src} alt={alt} className="w-full h-full object-cover" loading="lazy" />

          {/* dynamic island */}
          <div className="absolute top-[1.6%] left-1/2 -translate-x-1/2 w-[32%] h-[2.4%] bg-black rounded-full z-20" />

          {/* screen glare */}
          <div
            className="absolute inset-0 z-10 pointer-events-none opacity-[0.55] bg-[linear-gradient(112deg,transparent_28%,rgba(255,255,255,0.10)_42%,rgba(255,255,255,0.03)_52%,transparent_62%)]"
            aria-hidden="true"
          />
          {/* glass edge */}
          <div
            className="absolute inset-0 z-10 pointer-events-none rounded-[2.5rem] shadow-[0_0_0_1px_rgba(255,255,255,0.07)_inset]"
            aria-hidden="true"
          />
        </div>
      </div>
    </div>
  )
}

function Logo({ className = '' }) {
  return (
    <span className={`inline-flex items-center gap-3 select-none ${className}`}>
      <img
        src="/brand/appicon.png"
        alt=""
        className="w-[34px] h-[34px] rounded-[10px] object-cover shadow-[0_2px_10px_rgba(0,0,0,0.5)]"
      />
      <img
        src="/brand/wordmark.png"
        alt="Betlock"
        className="h-[21px] w-auto object-contain"
      />
    </span>
  )
}

/* ─────────────── waitlist ─────────────── */

function WaitlistForm({ tone = 'dark' }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle')

  const submit = async (e) => {
    e.preventDefault()
    if (!email || status === 'loading') return
    setStatus('loading')
    try {
      await addDoc(collection(db, 'waitlist'), {
        email: email.toLowerCase().trim(),
        createdAt: serverTimestamp(),
      })
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('error')
    }
  }

  const onLight = tone === 'light'

  if (status === 'done') {
    return (
      <p className={`font-mono text-[13px] tracking-wide ${onLight ? 'text-white' : 'text-win'}`}>
        ✓ You're on the list. We'll be in touch.
      </p>
    )
  }

  return (
    <form onSubmit={submit} className="w-full max-w-[440px]">
      <div className={`flex items-center gap-3 border-b ${onLight ? 'border-white/40' : 'border-zinc-700'} pb-3`}>
        <input
          type="email"
          required
          placeholder="your@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`flex-1 bg-transparent font-mono text-[15px] focus:outline-none ${
            onLight
              ? 'text-white placeholder-white/50'
              : 'text-zinc-100 placeholder-zinc-600'
          }`}
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className={`font-mono text-[12px] tracking-[0.14em] uppercase whitespace-nowrap cursor-pointer disabled:opacity-40 transition-opacity hover:opacity-70 ${
            onLight ? 'text-white' : 'text-accent'
          }`}
        >
          {status === 'loading' ? 'Sending' : 'Get access →'}
        </button>
      </div>
      {status === 'error' && (
        <p className="mt-2 font-mono text-[12px] text-loss">Something broke. Try again.</p>
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
        className="w-full flex items-baseline gap-5 sm:gap-8 py-6 text-left cursor-pointer group"
      >
        <span className="font-mono text-[11px] text-zinc-600 shrink-0 pt-1">{n}</span>
        <span className="flex-1 text-[16px] sm:text-[19px] font-medium text-zinc-200 group-hover:text-white transition-colors">
          {q}
        </span>
        <span className={`font-mono text-zinc-600 shrink-0 transition-transform duration-300 ${open ? 'rotate-45' : ''}`}>
          +
        </span>
      </button>
      <div
        className="overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)]"
        style={{ maxHeight: open ? h : 0 }}
      >
        <p ref={ref} className="text-[15px] text-zinc-500 leading-relaxed pb-7 sm:pl-[76px] max-w-2xl">
          {a}
        </p>
      </div>
    </div>
  )
}

/* ─────────────── content ─────────────── */

const failures = [
  'You planted a tree in a focus app. Then you killed the tree.',
  'You set a screen time limit. Then you tapped “Ignore Limit.”',
  'You deleted Instagram on Sunday. You reinstalled it Tuesday.',
]

const beats = [
  {
    n: '01',
    t: 'Your minutes become chips',
    d: 'Every minute of screen time is currency. Pick how many you are willing to put on the table.',
  },
  {
    n: '02',
    t: 'You play a real hand',
    d: 'Blackjack. Roulette. Actual odds, actual tension. Win and your balance climbs. Lose and it drops.',
  },
  {
    n: '03',
    t: 'The house collects',
    d: 'Run your balance to zero and the apps you chose stop opening. No streak to guilt you. A lock.',
  },
]

const faqs = [
  ['01', 'Does it actually lock my phone?', 'Yes. BETLOCK uses Apple’s Screen Time API to block the apps you pick. At zero balance a real block screen appears. It is not an honor system.'],
  ['02', 'Is this gambling? Is it legal?', 'No money is wagered. You bet minutes, not pesos. No gaming licence required, and nothing to lose but time you were going to lose anyway.'],
  ['03', 'Can I just turn it off?', 'You can revoke the permission in Settings. You can also walk out of the gym. The product only works on people who want the stakes.'],
  ['04', 'Android?', 'Not yet. Android has no equivalent blocking API. iOS 17 and up for now.'],
  ['05', 'Can I go negative?', 'Yes. A negative balance carries into tomorrow. Every morning you get a base balance so there is always a way back.'],
  ['06', 'What does it cost?', '$4.99 a month, or $29.99 a year. Three days free before anything is charged.'],
  ['07', 'Can I cancel?', 'Any time, from Settings → Subscriptions on your iPhone. No retention flow, no phone call.'],
]

/* ─────────────── landing ─────────────── */

function Landing() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div className="grain bg-bg text-zinc-50 font-sans antialiased overflow-x-hidden">

      {/* ── NAV ── */}
      <nav className={`fixed top-0 inset-x-0 z-50 transition-colors duration-500 ${scrolled ? 'bg-bg/85 backdrop-blur-xl border-b border-line' : ''}`}>
        <div className="max-w-[1240px] mx-auto flex items-center justify-between px-6 sm:px-10 h-[68px]">
          <a href="/"><Logo /></a>
          <a href="#access" className="font-mono text-[11px] tracking-[0.18em] uppercase text-zinc-400 hover:text-white ul-link transition-colors">
            Get access
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <header className="relative overflow-hidden pt-[68px]">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-12 gap-y-16 items-center min-h-[calc(100svh-68px)] py-16">

            <div className="lg:col-span-7 xl:col-span-6">
              <Kicker className="h-kicker text-accent mb-8">
                Screentime casino · iOS
              </Kicker>

              <h1 className="h-title font-display font-[900] leading-[0.87] tracking-[-0.04em] text-[clamp(3.4rem,8.5vw,7.2rem)]">
                Your screentime
                <br />
                is your <span className="text-accent">bet</span>.
              </h1>

              <p className="h-sub mt-8 text-[clamp(1.05rem,1.6vw,1.3rem)] text-zinc-400 leading-relaxed max-w-[30ch]">
                Play blackjack with the hours you were going to waste. Win them back, or watch your phone lock.
              </p>

              <div className="h-cta mt-12">
                <WaitlistForm />
              </div>

              <p className="h-note mt-5 font-mono text-[11px] tracking-[0.12em] uppercase text-zinc-600">
                Free to join · 3 days on us · No card
              </p>
            </div>

            <div className="lg:col-span-5 xl:col-span-6 flex justify-center lg:justify-end">
              <div className="h-phone relative lg:translate-x-6 xl:translate-x-14">
                {/* rear device, further away and dimmer */}
                <div className="hidden sm:block absolute -left-[38%] top-[9%] w-[78%] opacity-45">
                  <Phone
                    src="/screenshots/blackjack.png"
                    alt=""
                    width="100%"
                    tilt={-3}
                    depth={{ y: -20, x: 3 }}
                  />
                </div>

                {/* hero device */}
                <div className="relative z-10">
                  <Phone
                    src="/screenshots/home.png"
                    alt="BETLOCK home screen showing a time balance of 4 hours"
                    width="clamp(230px, 62vw, 296px)"
                    tilt={-2}
                    depth={{ y: -15, x: 3 }}
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </header>

      {/* ── 01 · THE PROBLEM ── */}
      <section className="border-t border-line py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <Kicker className="text-zinc-600 mb-12">01 — The problem</Kicker>
          </Reveal>
          <div className="grid lg:grid-cols-12 gap-y-8 items-end">
            <Reveal className="lg:col-span-7">
              <p className="font-display font-[900] leading-[0.82] tracking-[-0.045em] text-[clamp(4.5rem,15vw,11rem)] text-zinc-50">
                4<span className="text-zinc-600">h</span>30<span className="text-zinc-600">m</span>
              </p>
            </Reveal>
            <Reveal className="lg:col-span-5">
              <p className="text-[clamp(1.05rem,1.5vw,1.25rem)] text-zinc-400 leading-relaxed max-w-[34ch] lg:pb-6">
                The average day, on a phone, in Mexico. That is{' '}
                <span className="text-zinc-50">68 days a year</span> — gone, in four-minute pieces you never decided to spend.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 02 · WHY NOTHING WORKED ── */}
      <section className="py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <Kicker className="text-zinc-600 mb-14">02 — Why nothing worked</Kicker>
          </Reveal>
          <div className="stagger">
            {failures.map((f, i) => (
              <Reveal key={i}>
                <div className="border-t border-line py-8 sm:py-10">
                  <p className="text-[clamp(1.4rem,3.4vw,2.4rem)] font-[500] leading-[1.25] tracking-[-0.02em] text-zinc-300 max-w-[24ch]">
                    {f}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal>
            <div className="border-t border-line pt-10 sm:pt-12">
              <p className="text-[clamp(1.1rem,1.6vw,1.35rem)] text-zinc-500 max-w-[46ch] leading-relaxed">
                None of them ever cost you anything. That was the whole problem.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 03 · THE MECHANIC ── */}
      <section className="border-t border-line bg-surface py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <Kicker className="text-accent mb-12">03 — The mechanic</Kicker>
          </Reveal>

          <Reveal>
            <h2 className="font-display font-[900] leading-[0.92] tracking-[-0.035em] text-[clamp(2.4rem,6vw,4.6rem)] max-w-[16ch] mb-20">
              So we gave your time a price.
            </h2>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-16 items-start">
            <div className="lg:col-span-7 stagger">
              {beats.map((b) => (
                <Reveal key={b.n}>
                  <div className="border-t border-line py-8 flex gap-6 sm:gap-10">
                    <span className="font-mono text-[12px] text-accent shrink-0 pt-1.5">{b.n}</span>
                    <div>
                      <h3 className="text-[clamp(1.15rem,2vw,1.5rem)] font-semibold tracking-[-0.015em] mb-2.5">
                        {b.t}
                      </h3>
                      <p className="text-[15px] sm:text-base text-zinc-500 leading-relaxed max-w-[46ch]">
                        {b.d}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>

            <Reveal className="lg:col-span-5 flex justify-center lg:justify-end">
              <Phone
                src="/screenshots/games.png"
                alt="BETLOCK tables screen listing Blackjack and Roulette"
                width="clamp(200px, 56vw, 252px)"
                tilt={2}
                depth={{ y: 14, x: 3 }}
              />
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── 04 · THE GAMES ── */}
      <section className="border-t border-line py-20 sm:py-28 overflow-hidden">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <Kicker className="text-zinc-600 mb-12">04 — The floor</Kicker>
          </Reveal>

          <div className="grid lg:grid-cols-12 gap-14 items-center">
            <Reveal className="lg:col-span-5">
              <h2 className="font-display font-[900] leading-[0.92] tracking-[-0.035em] text-[clamp(2.2rem,5vw,3.8rem)] max-w-[14ch] mb-7">
                Real games. Real odds.
              </h2>
              <p className="text-[clamp(1rem,1.5vw,1.15rem)] text-zinc-500 leading-relaxed max-w-[38ch]">
                Not a metaphor for a casino — a casino. The dealer stands on all 17s. The wheel does not care that you have a deadline.
              </p>
              <p className="mt-8 font-mono text-[11px] tracking-[0.16em] uppercase text-zinc-600">
                Blackjack · Roulette · More coming
              </p>
            </Reveal>

            <div className="lg:col-span-7 flex justify-center lg:justify-end gap-5 sm:gap-8">
              <Reveal>
                <Phone
                  src="/screenshots/blackjack.png"
                  alt="BETLOCK blackjack table with a wager of 30 minutes"
                  width="clamp(132px, 37vw, 244px)"
                  tilt={-2}
                  depth={{ y: -16, x: 3 }}
                  className="lg:translate-y-8"
                />
              </Reveal>
              <Reveal>
                <Phone
                  src="/screenshots/roulette.png"
                  alt="BETLOCK live roulette wheel and betting grid"
                  width="clamp(132px, 37vw, 244px)"
                  tilt={2}
                  depth={{ y: 16, x: 3 }}
                  className="lg:-translate-y-8"
                />
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* ── 05 · THE STAKES (full bleed) ── */}
      <section className="bg-accent-deep text-white py-24 sm:py-32">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <Kicker className="text-white/70 mb-14">05 — The stakes</Kicker>
          </Reveal>
          <Reveal>
            <h2 className="font-display font-[900] leading-[0.88] tracking-[-0.04em] text-[clamp(2.8rem,8vw,6.4rem)] max-w-[15ch]">
              Hit zero and your apps stop opening.
            </h2>
          </Reveal>
          <Reveal>
            <div className="mt-14 grid sm:grid-cols-2 gap-10 max-w-3xl">
              <p className="text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-white">
                Not a reminder. Not a nudge. Not a streak you can quietly abandon on a Tuesday.
              </p>
              <p className="text-[clamp(1.05rem,1.6vw,1.3rem)] leading-relaxed text-white">
                A lock, enforced by iOS itself. Win your minutes back at the table, or wait for tomorrow.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <Kicker className="text-zinc-600 mb-12">The price</Kicker>
          </Reveal>
          <Reveal>
            <h2 className="font-display font-[900] leading-[0.92] tracking-[-0.035em] text-[clamp(2.2rem,5vw,3.6rem)] max-w-[16ch] mb-16">
              Cheaper than the coffee you drink to stay up later.
            </h2>
          </Reveal>

          <div className="stagger">
            {[
              { plan: 'Annual', price: '$29.99', unit: '/year', note: '$2.49 a month · save 50%', flag: true },
              { plan: 'Monthly', price: '$4.99', unit: '/month', note: 'Cancel any time', flag: false },
            ].map((p) => (
              <Reveal key={p.plan}>
                <div className="border-t border-line py-8 grid grid-cols-1 sm:grid-cols-12 gap-4 sm:gap-6 items-baseline">
                  <div className="sm:col-span-3 flex items-center gap-3">
                    <span className="font-mono text-[12px] tracking-[0.16em] uppercase text-zinc-300">{p.plan}</span>
                    {p.flag && (
                      <span className="font-mono text-[10px] tracking-[0.14em] uppercase text-accent border border-accent/40 rounded-full px-2 py-0.5">
                        Best
                      </span>
                    )}
                  </div>
                  <div className="sm:col-span-4">
                    <span className="font-display text-[clamp(2rem,4vw,2.8rem)] font-[900] tracking-[-0.03em]">{p.price}</span>
                    <span className="font-mono text-[13px] text-zinc-600 ml-1.5">{p.unit}</span>
                  </div>
                  <p className="sm:col-span-5 font-mono text-[12px] tracking-[0.06em] text-zinc-500">
                    {p.note}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal>
            <div className="border-t border-line pt-8">
              <p className="font-mono text-[11px] tracking-[0.14em] uppercase text-zinc-600">
                Three days free · Blackjack &amp; roulette · Real app blocking · Streaks
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="border-t border-line bg-surface py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="grid lg:grid-cols-12 gap-12">
            <Reveal className="lg:col-span-4">
              <Kicker className="text-zinc-600 mb-6">Questions</Kicker>
              <h2 className="font-display font-[900] leading-[0.95] tracking-[-0.03em] text-[clamp(1.9rem,3.4vw,2.6rem)] max-w-[12ch]">
                Before you ask.
              </h2>
            </Reveal>
            <Reveal className="lg:col-span-8">
              <div>
                {faqs.map(([n, q, a]) => (
                  <FAQItem key={n} n={n} q={q} a={a} />
                ))}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ── CLOSE ── */}
      <section id="access" className="border-t border-line py-28 sm:py-40">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <Reveal>
            <h2 className="font-display font-[900] leading-[0.9] tracking-[-0.04em] text-[clamp(2.6rem,7vw,5.4rem)] max-w-[14ch]">
              Put your hours on the table.
            </h2>
          </Reveal>
          <Reveal>
            <div className="mt-14 grid lg:grid-cols-12 gap-10 items-end">
              <div className="lg:col-span-6">
                <WaitlistForm />
              </div>
              <p className="lg:col-span-6 font-mono text-[11px] tracking-[0.14em] uppercase text-zinc-600 lg:text-right lg:pb-3">
                iPhone · iOS 17+ · Launching soon
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-line py-12">
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-8">
            <Logo />
            <div className="flex flex-wrap gap-x-8 gap-y-3 font-mono text-[11px] tracking-[0.14em] uppercase text-zinc-600">
              <a href="/privacy" className="hover:text-zinc-300 ul-link transition-colors">Privacy</a>
              <a href="/terms" className="hover:text-zinc-300 ul-link transition-colors">Terms</a>
              <a href="mailto:hello@betlock.app" className="hover:text-zinc-300 ul-link transition-colors">Contact</a>
              <a href="#" className="hover:text-zinc-300 ul-link transition-colors">Instagram</a>
              <a href="#" className="hover:text-zinc-300 ul-link transition-colors">TikTok</a>
            </div>
          </div>
          <div className="mt-10 flex flex-col sm:flex-row justify-between gap-2 font-mono text-[11px] tracking-[0.1em] uppercase text-zinc-700">
            <p>Made in Monterrey</p>
            <p>© 2026 BETLOCK</p>
          </div>
        </div>
      </footer>
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
  return <Landing />
}
