import { useState, useEffect, useCallback } from 'react'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, sendEmailVerification } from 'firebase/auth'
import { collection, query, orderBy, getDocs, limit, startAfter, getCountFromServer, deleteDoc, doc } from 'firebase/firestore'
import { auth, db } from './firebase'

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
    <div className="min-h-screen bg-bg flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-3 mb-10 justify-center">
          <img src="/brand/appicon.png" alt="" className="w-10 h-10 rounded-[12px] object-cover" />
          <span className="text-lg font-bold text-zinc-100 tracking-wide">ADMIN</span>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full bg-surface border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full bg-surface border border-zinc-800 rounded-xl px-4 py-3 text-sm text-zinc-100 placeholder-zinc-600 focus:outline-none focus:border-accent transition-colors"
          />
          {error && <p className="text-loss text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-accent hover:bg-accent-hover disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <a href="/" className="block text-center mt-6 text-sm text-zinc-600 hover:text-zinc-400 transition-colors">
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
      // Never fail to an empty table — an empty list and a rejected read look
      // identical to the reader, and that is how a broken panel goes unnoticed.
      setLoadError(
        err?.code === 'permission-denied'
          ? 'Firestore refused this read. Your session predates a permissions change — sign out and back in.'
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
    return ts.toDate().toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-bg text-zinc-100">
      <header className="border-b border-zinc-800/60 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/brand/appicon.png" alt="" className="w-8 h-8 rounded-[9px] object-cover" />
          <span className="text-sm font-bold tracking-wide">BETLOCK ADMIN</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-zinc-500">{user.email}</span>
          <button
            onClick={() => signOut(auth)}
            className="text-xs text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer"
          >
            Sign out
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total signups', value: totalCount },
            { label: 'Today', value: todayCount },
            { label: 'This page', value: entries.length },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-xl border border-zinc-800/60 p-5">
              <p className="text-xs text-zinc-500 mb-1">{s.label}</p>
              <p className="text-2xl font-bold text-accent tabular-nums">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-zinc-300">Waitlist Entries</h2>
          <button
            onClick={exportCSV}
            className="text-xs bg-surface border border-zinc-800 hover:border-zinc-600 text-zinc-300 px-4 py-2 rounded-lg transition-colors cursor-pointer"
          >
            Export CSV
          </button>
        </div>

        {loadError && (
          <div className="mb-4 border border-loss/40 bg-loss/10 text-loss rounded-xl px-5 py-4 text-sm">
            {loadError}
          </div>
        )}

        <div className="bg-surface border border-zinc-800/60 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800/60 text-zinc-500 text-xs">
                <th className="text-left px-5 py-3 font-medium">#</th>
                <th className="text-left px-5 py-3 font-medium">Email</th>
                <th className="text-left px-5 py-3 font-medium">Joined</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, i) => (
                <tr key={entry.id} className="border-b border-zinc-800/30 hover:bg-zinc-900/40 transition-colors group">
                  <td className="px-5 py-3 text-zinc-600 tabular-nums">{i + 1}</td>
                  <td className="px-5 py-3 text-zinc-200">{entry.email}</td>
                  <td className="px-5 py-3 text-zinc-500">{formatDate(entry.createdAt)}</td>
                  <td className="px-5 py-3 text-right">
                    {confirmId === entry.id ? (
                      <span className="inline-flex items-center gap-3">
                        <button
                          onClick={() => remove(entry.id)}
                          className="text-xs text-loss hover:underline cursor-pointer"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setConfirmId(null)}
                          className="text-xs text-zinc-600 hover:text-zinc-400 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </span>
                    ) : (
                      <button
                        onClick={() => setConfirmId(entry.id)}
                        className="text-xs text-zinc-700 hover:text-loss opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
                      >
                        Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {entries.length === 0 && !loading && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-zinc-600">No entries yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {loading && <p className="text-center text-zinc-600 text-sm mt-6">Loading...</p>}

        {hasMore && !loading && (
          <button
            onClick={() => fetchEntries(lastDoc)}
            className="mt-4 w-full text-sm text-zinc-400 hover:text-zinc-200 py-3 transition-colors cursor-pointer"
          >
            Load more
          </button>
        )}
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
      setErr('Could not send. Wait a minute and try again.')
    }
  }

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center px-5 text-center">
      <div className="max-w-sm">
        <img src="/brand/appicon.png" alt="" className="w-11 h-11 rounded-[13px] object-cover mx-auto mb-8" />
        <h1 className="text-lg font-semibold text-zinc-100 mb-3">Verify this address</h1>
        <p className="text-sm text-zinc-500 leading-relaxed mb-8">
          Waitlist access is only granted to a verified <span className="text-zinc-300">{user.email}</span>.
          This is what stops anyone else from registering your address and reading the list.
        </p>
        {sent ? (
          <p className="text-sm text-win">
            Sent. Open the link, then reload this page.
          </p>
        ) : (
          <button
            onClick={send}
            className="w-full bg-accent hover:bg-accent-hover text-white font-semibold py-3 rounded-xl transition-colors cursor-pointer"
          >
            Send verification email
          </button>
        )}
        {err && <p className="mt-3 text-sm text-loss">{err}</p>}
        <button
          onClick={() => signOut(auth)}
          className="block mx-auto mt-6 text-sm text-zinc-600 hover:text-zinc-400 transition-colors cursor-pointer"
        >
          Sign out
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
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <LoginScreen onLogin={setUser} />
  if (!user.emailVerified) return <VerifyScreen user={user} />
  return <Dashboard user={user} />
}
