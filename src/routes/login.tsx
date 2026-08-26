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
    window.location.replace('/')
  }
  return null
}