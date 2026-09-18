import { useState, useEffect, useCallback } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from 'firebase/auth'
import { collection, query, orderBy, getDocs, limit, startAfter, getCountFromServer, deleteDoc, doc } from 'firebase/firestore'
import { httpsCallable } from 'firebase/functions'
import { auth, db, functions } from './firebase'

const sendBroadcastFn = httpsCallable(functions, 'sendBroadcast')

const ADMIN_EMAIL = 'franco@varelta.com'
const PAGE_SIZE = 50

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password)
      if (cred.user.email !== ADMIN_EMAIL) {
        await signOut(auth)
        setError('Unauthorized account.')
        return
      }
      onLogin(cred.user)
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-light min-h-screen flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <img src="/brand/appicon.png" alt="" className="w-10 h-10 rounded-[12px] object-cover" />
          <span className="text-lg font-bold text-zinc-900 tracking-wide">ADMIN</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="admin-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="admin-input"
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="admin-btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <a href="/" className="block text-center mt-6 text-sm text-zinc-400 hover:text-zinc-600 transition-colors">
          &larr; Back to site
        </a>
      </div>
    </div>
  )
}

function Dashboard({ user }) {
  const [entries, setEntries] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [lastDoc, setLastDoc] = useState(null)
  const [hasMore, setHasMore] = useState(false)
  const [confirmId, setConfirmId] = useState(null)
  const [loadError, setLoadError] = useState('')

  const remove = async (id) => {
    try {
      await deleteDoc(doc(db, 'waitlist', id))
      setEntries((prev) => prev.filter((e) => e.id !== id))
      setTotalCount((n) => Math.max(0, n - 1))
    } catch (err) {
      console.error('Delete failed:', err)
    } finally {
      setConfirmId(null)
    }
  }

  const fetchEntries = useCallback(async (afterDoc = null) => {
    setLoading(true)
    setLoadError('')
    try {
      const ref = collection(db, 'waitlist')
      const constraints = [orderBy('createdAt', 'desc'), limit(PAGE_SIZE)]
      if (afterDoc) constraints.push(startAfter(afterDoc))
      const q = query(ref, ...constraints)
      const snap = await getDocs(q)
      const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }))

      if (afterDoc) {
        setEntries((prev) => [...prev, ...docs])
      } else {
        setEntries(docs)
      }
      setLastDoc(snap.docs[snap.docs.length - 1] || null)
      setHasMore(snap.docs.length === PAGE_SIZE)

      const countSnap = await getCountFromServer(collection(db, 'waitlist'))
      setTotalCount(countSnap.data().count)

      const todayStart = new Date()
      todayStart.setHours(0, 0, 0, 0)
      const todayDocs = docs.filter((d) => d.createdAt?.toDate?.() >= todayStart)
      setTodayCount(afterDoc ? todayCount : todayDocs.length)
    } catch (err) {
      setLoadError(
        err?.code === 'permission-denied'
          ? 'Firestore refused this read. Sign out and back in.'
          : `Could not load the waitlist: ${err?.message || err}`,
      )
    } finally {
      setLoading(false)
    }
  }, [todayCount])

  useEffect(() => { fetchEntries() }, [])

  const exportCSV = async () => {
    const ref = collection(db, 'waitlist')
    const q = query(ref, orderBy('createdAt', 'desc'))
    const snap = await getDocs(q)
    const rows = snap.docs.map((d) => {
      const data = d.data()
      const date = data.createdAt?.toDate?.()?.toISOString() || ''
      return `${data.email},${date}`
    })
    const csv = 'email,joined\n' + rows.join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `betlock-waitlist-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatDate = (ts) => {
    if (!ts?.toDate) return '—'
    return ts.toDate().toLocaleDateString('es-MX', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="admin-light min-h-screen">
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-zinc-200 px-6 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/brand/appicon.png" alt="" className="w-7 h-7 rounded-[8px] object-cover" />
          <span className="text-[13px] font-bold tracking-wide text-zinc-900">BETLOCK</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[12px] text-zinc-400">{user.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="text-[12px] text-zinc-400 hover:text-zinc-700 transition-colors cursor-pointer"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <h1 className="text-[22px] font-bold text-zinc-900 mb-8">Waitlist</h1>

        <div className="grid grid-cols-3 gap-3 mb-10">
          {[
            { label: 'Total', value: totalCount, accent: true },
            { label: 'Hoy', value: todayCount },
            { label: 'En página', value: entries.length },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-zinc-200 bg-white p-5">
              <p className="text-[12px] font-medium text-zinc-400 uppercase tracking-wide">{s.label}</p>
              <p className={`mt-1 text-[32px] font-bold tabular-nums leading-none ${s.accent ? 'text-violet-600' : 'text-zinc-900'}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <p className="text-[13px] font-medium text-zinc-500">
            {totalCount} {totalCount === 1 ? 'registro' : 'registros'}
          </p>
          <button
            onClick={exportCSV}
            className="text-[12px] font-medium text-zinc-500 hover:text-zinc-800 border border-zinc-200 hover:border-zinc-300 bg-white px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Exportar CSV
          </button>
        </div>

        {loadError && (
          <div className="mb-4 border border-red-200 bg-red-50 text-red-600 rounded-xl px-5 py-4 text-sm">
            {loadError}
          </div>
        )}

        <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-100 text-zinc-400">
                <th className="text-left px-5 py-3 font-medium text-[12px]">#</th>
                <th className="text-left px-5 py-3 font-medium text-[12px]">Email</th>
                <th className="text-left px-5 py-3 font-medium text-[12px]">Fecha</th>
                <th className="px-5 py-3 w-24" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className="border-b border-zinc-50 hover:bg-zinc-50/80 transition-colors group">
                  <td className="px-5 py-3.5 text-zinc-300 tabular-nums text-[13px]">{i + 1}</td>
                  <td className="px-5 py-3.5 text-zinc-800 font-medium text-[13px]">{entry.email}</td>
                  <td className="px-5 py-3.5 text-zinc-400 text-[13px]">{formatDate(entry.createdAt)}</td>
                  <td className="px-5 py-3.5 text-right">
                    {confirmId === entry.id ? (
                      <span className="inline-flex items-center gap-3">
                        <button
                          onClick={() => remove(entry.id)}
                          className="text-[12px] text-red-500 hover:underline cursor-pointer font-medium"
                        >
                          Sí, borrar
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-[12px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
                        >
                          No
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmId(entry.id)}
                        className="text-[12px] text-zinc-300 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all cursor-pointer"
                      >
                        Borrar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && !loadError && (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-zinc-400 text-[14px]">Sin registros todavía</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {hasMore && !loading && (
          <button
            onClick={() => fetchEntries(lastDoc)}
            className="mt-4 w-full text-[13px] text-zinc-400 hover:text-zinc-700 py-3 transition-colors cursor-pointer font-medium"
          >
            Cargar más
          </button>
        )}

        <EmailTools totalCount={totalCount} />
      </div>
    </div>
  )
}

function EmailTools({ totalCount }) {
  const [testEmail, setTestEmail] = useState('')
  const [testTemplate, setTestTemplate] = useState('confirmation')
  const [testStatus, setTestStatus] = useState('')
  const [broadcastStatus, setBroadcastStatus] = useState('')
  const [confirmBroadcast, setConfirmBroadcast] = useState(false)

  const sendTest = async (e) => {
    e.preventDefault()
    const trimmed = testEmail.toLowerCase().trim()
    if (!trimmed) return
    setTestStatus('sending')
    try {
      await sendBroadcastFn({
        to: trimmed,
        template: testTemplate,
        subject: testTemplate === 'launch'
          ? '[TEST] BETLOCK is live 🎰'
          : "[TEST] You're on the BETLOCK waitlist 🎰",
      })
      setTestStatus('done')
    } catch (err) {
      setTestStatus(`Error: ${err.message}`)
    }
  }

  const sendBroadcast = async () => {
    setBroadcastStatus('sending')
    setConfirmBroadcast(false)
    try {
      const result = await sendBroadcastFn({
        subject: "BETLOCK is live 🎰 — Your first month is free",
        template: 'launch',
      })
      const { sent, failed, total } = result.data
      setBroadcastStatus(`Enviado a ${sent}/${total} emails${failed ? ` (${failed} fallidos)` : ''}`)
    } catch (err) {
      setBroadcastStatus(`Error: ${err.message}`)
    }
  }

  return (
    <div className="mt-10 pt-8 border-t border-zinc-200">
      <h2 className="text-[16px] font-bold text-zinc-900 mb-6">Email Tools</h2>

      <div className="grid sm:grid-cols-2 gap-4">
        {/* Test email */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-[13px] font-semibold text-zinc-800 mb-1">Enviar email de prueba</p>
          <p className="text-[12px] text-zinc-400 mb-4">Manda la plantilla solo a esta dirección. No la registra en la waitlist y puedes repetirlo las veces que quieras.</p>
          <div className="flex gap-2 mb-2">
            {[['confirmation', 'Confirmación'], ['launch', 'Lanzamiento']].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTestTemplate(val)}
                className={`h-8 px-3 rounded-lg text-[12px] font-medium cursor-pointer transition-colors ${testTemplate === val ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <form onSubmit={sendTest} className="flex gap-2">
            <input
              type="email"
              required
              placeholder="test@email.com"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="admin-input flex-1"
              style={{ height: 40, fontSize: 13 }}
            />
            <button
              type="submit"
              disabled={testStatus === 'sending'}
              className="admin-btn-primary px-4 shrink-0"
              style={{ height: 40, fontSize: 13 }}
            >
              {testStatus === 'sending' ? 'Enviando...' : 'Enviar test'}
            </button>
          </form>
          {testStatus === 'done' && (
            <p className="mt-2 text-[12px] text-emerald-600 font-medium">Enviado. Debería llegar en unos segundos.</p>
          )}
          {testStatus && testStatus !== 'done' && testStatus !== 'sending' && (
            <p className="mt-2 text-[12px] text-red-500">{testStatus}</p>
          )}
        </div>

        {/* Broadcast */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-[13px] font-semibold text-zinc-800 mb-1">Broadcast de lanzamiento</p>
          <p className="text-[12px] text-zinc-400 mb-4">Envía el email de "we're live" a <strong>todos</strong> los {totalCount} emails de la waitlist.</p>
          {confirmBroadcast ? (
            <div className="flex items-center gap-3">
              <button
                onClick={sendBroadcast}
                className="text-[13px] font-semibold text-red-600 hover:underline cursor-pointer"
              >
                Sí, enviar a todos
              </button>
              <button
                onClick={() => setConfirmBroadcast(false)}
                className="text-[13px] text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmBroadcast(true)}
              disabled={broadcastStatus === 'sending' || totalCount === 0}
              className="admin-btn-primary w-full disabled:opacity-50"
              style={{ height: 40, fontSize: 13, background: '#DC2626' }}
            >
              {broadcastStatus === 'sending' ? 'Enviando a todos...' : `Enviar a ${totalCount} personas`}
            </button>
          )}
          {broadcastStatus && broadcastStatus !== 'sending' && (
            <p className={`mt-2 text-[12px] font-medium ${broadcastStatus.startsWith('Error') ? 'text-red-500' : 'text-emerald-600'}`}>
              {broadcastStatus}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

function VerifyScreen({ user }) {
  const [sent, setSent] = useState(false)
  const [err, setErr] = useState('')

  const send = async () => {
    setErr('')
    try {
      await sendEmailVerification(user)
      setSent(true)
    } catch {
      setErr('No se pudo enviar. Espera un momento e intenta de nuevo.')
    }
  }

  return (
    <div className="admin-light min-h-screen flex items-center justify-center px-5 text-center">
      <div className="max-w-sm">
        <img src="/brand/appicon.png" alt="" className="w-11 h-11 rounded-[13px] object-cover mx-auto mb-8" />
        <h1 className="text-lg font-bold text-zinc-900 mb-3">Verifica tu email</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          Se necesita verificar <span className="text-zinc-800 font-medium">{user.email}</span> antes de acceder al panel.
        </p>
        {sent ? (
          <p className="text-sm text-emerald-600 font-medium">
            Enviado. Abre el link y recarga esta página.
          </p>
        ) : (
          <button onClick={send} className="admin-btn-primary w-full">
            Enviar email de verificación
          </button>
        )}
        {err && <p className="mt-3 text-sm text-red-500">{err}</p>}
        <button
          onClick={() => signOut(auth)}
          className="block mx-auto mt-6 text-sm text-zinc-400 hover:text-zinc-600 transition-colors cursor-pointer"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}

export default function AdminPanel() {
  const [user, setUser] = useState(null)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      if (u && u.email === ADMIN_EMAIL) {
        setUser(u)
      } else {
        setUser(null)
      }
      setChecking(false)
    })
  }, [])

  if (checking) {
    return (
      <div className="admin-light min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen onLogin={setUser} />
  if (!user.emailVerified) return <VerifyScreen user={user} />
  return <Dashboard user={user} />
}
