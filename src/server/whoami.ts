import { createServerFn } from '@tanstack/react-start'
import { auth } from './auth'

// Returns the identity the edge has authenticated for the current request, or
// null for an anonymous visitor. Caddy stamps X-Auth-User on EVERY route for a
// signed-in user (the @authed optional-auth matcher), so this works on public
// pages too — it's how the client shows "signed in as <user>" in the corner.
export const whoami = createServerFn({ method: 'GET', middleware: [auth] }).handler(
  async ({ context }) => {
    return { user: context.authUser ?? null }
  },
)
