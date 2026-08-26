import { createFileRoute } from '@tanstack/react-router'

// /login is edge-gated by Caddy (@login) for HTTP Basic auth — but unlike
// /admin/*, the browser must be able to reach it from a signed-OUT state so it
// can show the native credential prompt. Reaching this page means the request
// got through Caddy (i.e. we now have valid credentials), so we immediately
// send the user home. The "sign in" button in UserBadge is a plain <a> to
// /login (full page nav, NOT a client-side Link) precisely so the browser's
// Basic-auth dialog appears on the 401.
export const Route = createFileRoute('/login')({
  head: () => ({
    meta: [{ title: 'Sign in - Spells' }],
  }),
  component: LoginRoute,
})

function LoginRoute() {
  if (typeof window !== 'undefined') {
    // Landing here means the browser just completed a full-page nav to /login
    // (following the "sign in" link) and the Basic-auth dialog succeeded. Go
    // BACK to the page the user was on rather than always dumping them home —
    // they clicked sign-in from somewhere specific (e.g. a shared card) and
    // should resume there. document.referrer, being the same-tab previous
    // location, is that page; ignore anything cross-origin and fall back to
    // home when there's no referrer (direct /login visit or new tab).
    const { origin } = window.location
    const referrer = document.referrer
    if (referrer && referrer.startsWith(origin)) {
      window.location.replace(referrer)
    } else {
      window.location.replace('/')
    }
  }
  return null
}