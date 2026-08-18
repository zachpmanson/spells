// Canonical public origin used to build absolute og:image URLs in server-side
// head() meta. Override via SPELLS_PUBLIC_URL if the service is ever served
// from a different host. The client bundle also imports this module, and
// process.env is undefined there, so it falls back to the constant.
export const PUBLIC_ORIGIN =
  typeof process !== 'undefined' && process.env?.SPELLS_PUBLIC_URL
    ? process.env.SPELLS_PUBLIC_URL.replace(/\/+$/, '')
    : 'https://spells.zachmanson.com'
