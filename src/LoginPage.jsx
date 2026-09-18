import { useState } from 'react'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from './firebase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password)
      window.location.hash = '#admin'
    } catch (err) {
      const map = {
        'auth/invalid-credential': 'Email o contraseña incorrectos.',
        'auth/user-not-found': 'No existe una cuenta con ese email.',
        'auth/wrong-password': 'Contraseña incorrecta.',
        'auth/too-many-requests': 'Demasiados intentos. Espera un momento.',
        'auth/invalid-email': 'Email no válido.',
      }
      setError(map[err.code] || 'Algo salió mal. Intenta de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-svh bg-bg text-zinc-50 font-sans antialiased grid place-items-center px-5">
      <form onSubmit={submit} className="w-full max-w-[360px] space-y-5">
        <a href="/" aria-label="Inicio">
          <img src="/brand/appicon.png" alt="" className="w-10 h-10 rounded-[12px] object-cover" />
        </a>

        <h1 className="font-display font-[900] uppercase text-[28px] leading-none tracking-[-0.03em]">
          Entrar
        </h1>

        <div>
          <label htmlFor="login-email" className="sr-only">Email</label>
          <input
            id="login-email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl bg-surface border border-line px-4 text-[16px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
            placeholder="Email"
          />
        </div>

        <div>
          <label htmlFor="login-pass" className="sr-only">Contraseña</label>
          <input
            id="login-pass"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl bg-surface border border-line px-4 text-[16px] text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-accent transition-colors"
            placeholder="Contraseña"
          />
        </div>

        {error && <p className="text-loss text-[13px]">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 rounded-xl bg-accent text-white font-display font-[800] uppercase text-[15px] tracking-[0.02em] hover:bg-accent-hover transition-colors cursor-pointer disabled:opacity-50"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
