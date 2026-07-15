import path from 'node:path'

// Under the NixOS module, systemd's StateDirectory=spells sets $STATE_DIRECTORY
// to a writable /var/lib/spells at runtime (the Nix store output itself is
// read-only). Locally this just falls back to ./data.
export function getDataDir(): string {
  return process.env.STATE_DIRECTORY ?? path.resolve(process.cwd(), 'data')
}
