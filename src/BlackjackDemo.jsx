import { useState, useRef, useEffect } from 'react'

/* A playable hand of blackjack, wagering minutes instead of money.
   The dealer stands on all 17s and blackjack pays 3:2 — same house rules
   as the app. Run the balance to zero and the demo "locks your phone". */

const START = 240
const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
const WAGERS = [15, 30, 60, 'all']

let uid = 0
function newShoe() {
  const shoe = []
  for (let n = 0; n < 2; n++)
    for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s })
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shoe[i], shoe[j]] = [shoe[j], shoe[i]]
  }
  return shoe
}

function handValue(hand) {
  let total = 0
  let aces = 0
  for (const { r } of hand) {
    if (r === 'A') { total += 11; aces++ }
    else if ('JQK'.includes(r) || r === '10') total += 10
    else total += Number(r)
  }
  while (total > 21 && aces) { total -= 10; aces-- }
  return total
}

export function formatMinutes(m) {
  const sign = m < 0 ? '−' : ''
  const a = Math.abs(m)
  return `${sign}${Math.floor(a / 60)}h ${String(a % 60).padStart(2, '0')}m`
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export function PlayingCard({ card, hidden = false, index = 0, className = '' }) {
  const red = card.s === '♥' || card.s === '♦'
  return (
    <div className={`pcard ${className}`} style={{ '--i': index }}>
      <div className={`pcard-inner ${hidden ? 'is-hidden' : ''}`}>
        <div className={`pcard-face ${red ? 'text-accent' : 'text-zinc-950'}`}>
          <span className="pcard-corner">{card.r}<br />{card.s}</span>
          <span className="pcard-pip">{card.s}</span>
          <span className="pcard-corner pcard-corner--flip">{card.r}<br />{card.s}</span>
        </div>
        <div className="pcard-back" aria-hidden="true"><span>♠</span></div>
      </div>
    </div>
  )
}

export function LockGlyph({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="4.5" y="10.5" width="15" height="10.5" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </svg>
  )
}

const VERDICT = {
  bj: { label: 'Blackjack', tone: 'win' },
  win: { label: 'You win', tone: 'win' },
  dealerBust: { label: 'Dealer busts', tone: 'win' },
  bust: { label: 'Bust', tone: 'loss' },
  lose: { label: 'House wins', tone: 'loss' },
  push: { label: 'Push', tone: 'push' },
}

export default function BlackjackDemo({ lockedSlot }) {
  const [balance, setBalance] = useState(START)
  const [wager, setWager] = useState(30)
  const [phase, setPhase] = useState('bet') // bet · play · dealer · over
  const [player, setPlayer] = useState([])
  const [dealer, setDealer] = useState([])
  const [reveal, setReveal] = useState(false)
  const [result, setResult] = useState(null)
  const [hands, setHands] = useState(0)
  const [locked, setLocked] = useState(false)

  const shoe = useRef(newShoe())
  const stake = useRef(0)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => { alive.current = false }
  }, [])

  const draw = () => {
    if (shoe.current.length < 16) shoe.current = newShoe()
    return { ...shoe.current.pop(), id: ++uid }
  }

  const effectiveWager = wager === 'all' ? balance : Math.min(wager, balance)

  const settle = async (kind) => {
    const s = stake.current
    const delta =
      kind === 'bj' ? Math.round(s * 1.5)
      : kind === 'win' || kind === 'dealerBust' ? s
      : kind === 'push' ? 0
      : -s
    const next = balance + delta
    setBalance(next)
    setResult({ kind, delta, key: uid })
    setPhase('over')
    if (next <= 0) {
      await sleep(1100)
      if (alive.current) setLocked(true)
    }
  }

  const deal = () => {
    if (effectiveWager <= 0) return
    stake.current = effectiveWager
    const p = [draw(), draw()]
    const d = [draw(), draw()]
    setPlayer(p)
    setDealer(d)
    setReveal(false)
    setResult(null)
    setHands((h) => h + 1)
    if (handValue(p) === 21) {
      setPhase('dealer')
      setTimeout(() => {
        if (!alive.current) return
        setReveal(true)
        settle(handValue(d) === 21 ? 'push' : 'bj')
      }, 900)
    } else {
      setPhase('play')
    }
  }

  const stand = async (p = player) => {
    setPhase('dealer')
    await sleep(350)
    if (!alive.current) return
    setReveal(true)
    let d = [...dealer]
    await sleep(650)
    while (handValue(d) < 17) {
      d = [...d, draw()]
      if (!alive.current) return
      setDealer(d)
      await sleep(600)
    }
    const pv = handValue(p)
    const dv = handValue(d)
    settle(dv > 21 ? 'dealerBust' : pv > dv ? 'win' : pv < dv ? 'lose' : 'push')
  }

  const hit = () => {
    const p = [...player, draw()]
    setPlayer(p)
    const v = handValue(p)
    if (v > 21) {
      setPhase('dealer')
      setTimeout(() => {
        if (!alive.current) return
        setReveal(true)
        settle('bust')
      }, 500)
    } else if (v === 21) {
      stand(p)
    }
  }

  const reset = () => {
    setBalance(START)
    setPlayer([])
    setDealer([])
    setResult(null)
    setPhase('bet')
    setLocked(false)
    setHands(0)
  }

  const low = balance <= 60
  const verdict = result && VERDICT[result.kind]
  const betting = phase === 'bet' || phase === 'over'

  return (
    <div className="relative rounded-[28px] border border-line bg-surface overflow-hidden">
      {/* ── balance bar ── */}
      <div className="flex items-center justify-between gap-4 px-5 sm:px-7 pt-5 sm:pt-6">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">Your balance</p>
          <p
            key={balance}
            className={`balance-tick font-display font-[900] tracking-[-0.03em] text-[clamp(2rem,5vw,2.8rem)] leading-none mt-1.5 tabular-nums ${
              balance <= 0 ? 'text-accent' : low ? 'text-amber-400' : 'text-zinc-50'
            }`}
          >
            {formatMinutes(Math.max(balance, 0))}
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">Hand</p>
          <p className="font-mono text-[15px] text-zinc-300 mt-2 tabular-nums">#{String(hands).padStart(2, '0')}</p>
        </div>
      </div>

      {/* balance meter */}
      <div className="mx-5 sm:mx-7 mt-4 h-[3px] rounded-full bg-line overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width,background-color] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${low ? 'bg-accent' : 'bg-zinc-100'}`}
          style={{ width: `${Math.min(100, Math.max(0, (balance / START) * 100))}%` }}
        />
      </div>

      {/* ── felt ── */}
      <div className="felt relative mx-3 sm:mx-4 mt-5 rounded-[22px] px-4 sm:px-6 py-6 min-h-[330px] sm:min-h-[360px] flex flex-col justify-between">
        {/* dealer */}
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 mb-3">
            Dealer {dealer.length > 0 && <span className="text-zinc-300 ml-1">{reveal ? handValue(dealer) : '?'}</span>}
          </p>
          <div className="flex h-[var(--card-h)]">
            {dealer.map((c, i) => (
              <PlayingCard key={c.id} card={c} index={i} hidden={i === 1 && !reveal} />
            ))}
            {dealer.length === 0 && <div className="pcard-slot" />}
          </div>
        </div>

        {/* verdict */}
        <div className="h-12 flex items-center justify-center">
          {verdict && (
            <div
              key={result.key}
              className={`verdict inline-flex items-center gap-3 rounded-full px-4 py-2 font-mono text-[12px] tracking-[0.14em] uppercase ${
                verdict.tone === 'win' ? 'bg-win text-zinc-950' : verdict.tone === 'loss' ? 'bg-accent text-white' : 'bg-zinc-700 text-zinc-100'
              }`}
            >
              <span>{verdict.label}</span>
              {result.delta !== 0 && (
                <span className="font-semibold">{result.delta > 0 ? '+' : '−'}{Math.abs(result.delta)}m</span>
              )}
            </div>
          )}
          {!verdict && phase === 'bet' && (
            <p className="font-mono text-[11px] tracking-[0.16em] uppercase text-zinc-600">Place a bet · Dealer stands on 17</p>
          )}
        </div>

        {/* player */}
        <div>
          <div className="flex h-[var(--card-h)]">
            {player.map((c, i) => (
              <PlayingCard key={c.id} card={c} index={i} />
            ))}
            {player.length === 0 && <div className="pcard-slot" />}
          </div>
          <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 mt-3">
            You {player.length > 0 && <span className="text-zinc-300 ml-1">{handValue(player)}</span>}
          </p>
        </div>
      </div>

      {/* ── controls ── */}
      <div className="px-3 sm:px-4 pt-4 pb-4 sm:pb-5">
        {betting ? (
          <>
            <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Wager">
              {WAGERS.map((w) => {
                const disabled = w !== 'all' && w > balance
                const active = wager === w
                return (
                  <button
                    key={w}
                    role="radio"
                    aria-checked={active}
                    disabled={disabled || balance <= 0}
                    onClick={() => setWager(w)}
                    className={`h-12 rounded-2xl font-mono text-[13px] tracking-[0.06em] uppercase transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed active:scale-[0.96] ${
                      active ? 'bg-zinc-50 text-zinc-950' : 'bg-card text-zinc-300 hover:bg-zinc-700'
                    }`}
                  >
                    {w === 'all' ? 'All in' : `${w}m`}
                  </button>
                )
              })}
            </div>
            <button
              onClick={deal}
              disabled={balance <= 0}
              className="mt-2 w-full h-14 rounded-2xl bg-accent hover:bg-accent-hover text-white font-display font-[800] uppercase tracking-[0.02em] text-[18px] transition-all active:scale-[0.99] cursor-pointer disabled:opacity-40"
            >
              {phase === 'over' ? 'Deal again' : 'Deal'} · bet {formatMinutes(effectiveWager)}
            </button>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={hit}
              disabled={phase !== 'play'}
              className="h-[104px] sm:h-[108px] rounded-2xl bg-zinc-50 text-zinc-950 font-display font-[900] uppercase text-[22px] tracking-[-0.01em] transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
            >
              Hit
            </button>
            <button
              onClick={() => stand()}
              disabled={phase !== 'play'}
              className="h-[104px] sm:h-[108px] rounded-2xl bg-card text-zinc-50 font-display font-[900] uppercase text-[22px] tracking-[-0.01em] hover:bg-zinc-700 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-40"
            >
              Stand
            </button>
          </div>
        )}
      </div>

      {/* ── locked ── */}
      {locked && (
        <div className="lock-in absolute inset-0 z-20 bg-accent text-white flex flex-col justify-between p-6 sm:p-8">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-white/80">Balance 0h 00m</span>
            <LockGlyph className="w-7 h-7" />
          </div>
          <div>
            <p className="font-display font-[900] uppercase leading-[0.86] tracking-[-0.035em] text-[clamp(2.6rem,7vw,4rem)]">
              Phone
              <br />
              locked.
            </p>
            <p className="mt-4 text-[16px] leading-relaxed text-white/90 max-w-[32ch]">
              In the real app, Instagram and TikTok just stopped opening. Win it back tomorrow — or join before launch.
            </p>
          </div>
          <div>
            {lockedSlot}
            <button
              onClick={reset}
              className="mt-4 font-mono text-[11px] tracking-[0.18em] uppercase text-white/75 hover:text-white underline underline-offset-4 cursor-pointer"
            >
              Reset the demo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
