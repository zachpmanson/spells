import { createMiddleware } from '@tanstack/react-start'

// Edge-forwarded identity (trust-the-edge). Caddy authenticates via HTTP Basic
// auth and stamps the upstream request with the X-Auth-User header naming who
// logged in (the basicauth username). spells knows nothing about passwords or
// sessions — it trusts that header because Caddy is its ONLY ingress (the
// service binds loopback-only; see the nix module). To keep that a real
// boundary, `requireAuth` is attached to every mutating server function, and
// the module must never be reachable except through the proxy that stamps it.
//
// The injected context value is `user`: the authenticated identity, or null
// for an anonymous request (no header / not stamped). See RequestServerResult
// in @tanstack/react-start — request middleware `.server()` receives the raw
// Request and can put values on `context` for downstream handlers to read.
export const auth = createMiddleware({
  type: 'request',
}).server(async ({ request, next }) => {
  const user = request.headers.get('x-auth-user') ?? null
  return next({ context: { authUser: user } })
})