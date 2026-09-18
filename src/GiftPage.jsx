import PrizeWheel from './PrizeWheel'

/* /gift — where people land right after joining the waitlist. The landing
   page never names the prize; it is only revealed here, by the wheel.
   Opening the URL directly without having joined shows a way back instead. */

function hasTicket() {
  try {
    return Boolean(sessionStorage.getItem('bl_gift'))
  } catch {
    return false
  }
}

export default function GiftPage() {
  const goHome = () => window.location.assign('/')

  if (hasTicket()) {
    return (
      <div className="min-h-[100svh] bg-bg">
        <PrizeWheel onClose={goHome} />
      </div>
    )
  }

  return (
    <div className="hero-field min-h-[100svh] text-zinc-50 font-sans antialiased flex flex-col items-center justify-center px-6 text-center">
      <img src="/brand/appicon.png" alt="" className="w-14 h-14 rounded-[16px] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.8)]" />
      <p className="mt-8 font-mono text-[11px] tracking-[0.22em] uppercase text-zinc-500">Waitlist gift</p>
      <h1 className="mt-4 font-display font-[900] uppercase leading-[0.9] tracking-[-0.035em] text-[clamp(2.4rem,8vw,4.4rem)] max-w-[12ch]">
        Join first. <span className="text-accent">Then spin.</span>
      </h1>
      <p className="mt-5 text-zinc-400 text-[16px] leading-relaxed max-w-[34ch]">
        The gift unlocks the moment you join the waitlist.
      </p>
      <a
        href="/#access"
        className="mt-9 inline-flex items-center h-14 rounded-full bg-accent hover:bg-accent-hover px-8 font-display font-[800] uppercase text-[16px] tracking-[0.02em] text-white transition-colors"
      >
        Join the waitlist
      </a>
    </div>
  )
}
