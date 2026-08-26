import { useEffect, useState } from 'react'
import { whoami } from '../server/whoami'

// Top-right corner identity chip. On mount it asks the server who's signed in
// (the edge stamps X-Auth-User for authenticated requests on public pages too),
// then shows "signed in as zach" or nothing. Anonymous visitors see a "sign in"
// link that does a FULL PAGE navigation to /login — the edge returns 401 on it
// which triggers the browser's native Basic-auth prompt.
// NOTE: it must be a plain <a>, not a TanStack <Link> — client-side Link
// navigation fetches the route and a fetch-based 401 never shows the browser's
// credential dialog (needs a full page load). That's the whole point of /login.
export function UserBadge() {
  const [user, setUser] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    whoami()
      .then(({ user }) => setUser(user))
      .catch(() => setUser(null))
      .finally(() => setChecked(true))
  }, [])

  return (
    <div className="pointer-events-none fixed bottom-3 right-3 z-50 flex flex-col items-end gap-1">
      {checked && user ? (
        <span className="rounded-full bg-slate-800/80 px-3 py-1 text-xs font-medium text-slate-100 ring-1 ring-slate-600/60">
          signed in as {user}
        </span>
      ) : checked ? (
        <a
          href="/login"
          className="pointer-events-auto rounded-full bg-slate-800/40 px-3 py-1 text-xs font-medium text-slate-400 ring-1 ring-slate-700/60 transition hover:bg-slate-700/60 hover:text-slate-200"
          title="Sign in to edit"
        >
          sign in
        </a>
      ) : null}
    </div>
  )
}
