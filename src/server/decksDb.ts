import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Deck } from '../types/deck'
import { getDataDir } from './dataDir'
import type { SavedCard } from './cardsDb'
import { redactEditId } from './cardsDb'

let db: DatabaseSync | null = null

// Pre-dates the ogImage deck-cover column — a tiny ALTER is all that's needed.
function migrateAddDeckOgImage(instance: DatabaseSync): void {
  const columns = instance.prepare('PRAGMA table_info(decks)').all() as unknown as Array<{ name: string }>
  if (columns.length === 0 || columns.some((c) => c.name === 'ogImage')) return
  instance.exec('ALTER TABLE decks ADD COLUMN ogImage TEXT')
}

// Pre-dates account ownership (mirrors cards.owner): initial migration
// claims every existing deck for the default owner ('zach'), matching the
// cards backfill so the whole pre-auth library sits in the owning account.
// Claimed decks are writable only by that owner; cards' editId-gated.
function migrateAddDeckOwner(instance: DatabaseSync): void {
  const columns = instance.prepare('PRAGMA table_info(decks)').all() as unknown as Array<{ name: string }>
  if (columns.length === 0) return
  if (!columns.some((c) => c.name === 'owner')) {
    instance.exec('ALTER TABLE decks ADD COLUMN owner TEXT')
  }
  // Idempotent claim of unowned rows for the default owner. Mirrors the cards
  // migration; the column is guaranteed present after this runs.
  instance.prepare('UPDATE decks SET owner = ? WHERE owner IS NULL').run('zach')
}

function getDb(): DatabaseSync {
  if (db) return db

  mkdirSync(getDataDir(), { recursive: true })
  // Shares the cards.sqlite file with cardsDb.ts so deck_cards can JOIN straight
  // into the cards table without cross-database attachment.
  db = new DatabaseSync(path.join(getDataDir(), 'cards.sqlite'))
  db.exec(`
    CREATE TABLE IF NOT EXISTS decks (
      publicId TEXT PRIMARY KEY,
      editId TEXT NOT NULL UNIQUE,
      id TEXT NOT NULL,
      title TEXT NOT NULL,
      ogImage TEXT,
      owner TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  db.exec(`
    CREATE TABLE IF NOT EXISTS deck_cards (
      deckPublicId TEXT NOT NULL,
      cardPublicId TEXT NOT NULL,
      addedAt TEXT NOT NULL,
      PRIMARY KEY (deckPublicId, cardPublicId)
    )
  `)
  migrateAddDeckImage(db)
  migrateAddDeckOwner(db)
  return db
}

interface DeckRow {
  publicId: string
  editId: string
  id: string
  title: string
  ogImage: string | null
  owner: string | null
  createdAt: string
  updatedAt: string
}

export type SavedDeck = Deck & { owner: string | null; createdAt: string; updatedAt: string }

function rowToDeck(row: DeckRow): SavedDeck {
  return {
    id: row.id,
    publicId: row.publicId,
    editId: row.editId,
    title: row.title,
    ogImage: row.ogImage ?? null,
    owner: row.owner ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

// Owner-gating shared by every deck edit path. A claimed deck (owner set) is
// writable only by that owner; an unclaimed deck stays writable by its editId
// bearer (pre-auth rows). `owner` is the caller's forwarded identity (from the
// auth request-middleware context), null when unauthenticated.
export function assertDeckOwnership(deck: SavedDeck | null, owner: string | null): void {
  if (!deck) return
  if (deck.owner && deck.owner !== owner) {
    throw new Error('Not authorized to edit this deck')
  }
}

export function renameDeck(editId: string, title: string, owner: string | null): void {
  const deck = getDeckByEditId(editId)
  assertDeckOwnership(deck, owner)
  getDb()
    .prepare('UPDATE decks SET title = ?, updatedAt = ? WHERE editId = ?')
    .run(title, new Date().toISOString(), editId)
}

export function upsertDeck(deck: Deck, owner: string | null): void {
  const existing = getDeckByPublicId(deck.publicId)
  assertDeckOwnership(existing, owner)
  const effectiveOwner = existing?.owner ?? owner
  const now = new Date().toISOString()
  getDb()
    .prepare(`
      INSERT INTO decks (publicId, editId, id, title, ogImage, owner, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(publicId) DO UPDATE SET
        title = excluded.title,
        ogImage = excluded.ogImage,
        updatedAt = excluded.updatedAt
    `)
    .run(deck.publicId, deck.editId, deck.id, deck.title, deck.ogImage ?? null, effectiveOwner, now, now)
}

export function listSavedDecks(page = 0, pageSize = 24): { decks: SavedDeck[]; total: number } {
  const rows = getDb()
    .prepare('SELECT * FROM decks ORDER BY updatedAt DESC LIMIT ? OFFSET ?')
    .all(pageSize, page * pageSize) as unknown as DeckRow[]
  const { count } = getDb().prepare('SELECT COUNT(*) AS count FROM decks').get() as unknown as { count: number }
  return { decks: rows.map(rowToDeck), total: count }
}

// Decks owned by a specific identity. Backs the signed-in index ("my
// library"): lists only rows claimed by the forwarded X-Auth-User owner. The
// same ownership-gate rule as cards — unclaimed rows belong to the
// anonymous/editId flow and are not shown to a signed-in owner here.
export function listOwnedDecks(owner: string): SavedDeck[] {
  const rows = getDb()
    .prepare('SELECT * FROM decks WHERE owner = ? ORDER BY updatedAt DESC')
    .all(owner) as unknown as DeckRow[]
  return rows.map(rowToDeck)
}

// Deletes a deck, owner-gated: only the deck's claimed owner may delete it.
// Also removes its membership rows in deck_cards.
export function deleteDeck(publicId: string, owner: string | null): void {
  const row = getDb().prepare('SELECT * FROM decks WHERE publicId = ?').get(publicId) as unknown as DeckRow | undefined
  if (!row) return
  if (row.owner && row.owner !== owner) throw new Error('Not authorized to delete this deck')
  getDb().prepare('DELETE FROM deck_cards WHERE deckPublicId = ?').run(publicId)
  getDb().prepare('DELETE FROM decks WHERE publicId = ?').run(publicId)
}

export function getDeckByPublicId(publicId: string): SavedDeck | null {
  const row = getDb().prepare('SELECT * FROM decks WHERE publicId = ?').get(publicId) as unknown as DeckRow | undefined
  return row ? rowToDeck(row) : null
}

// A deck reached through its read-only publicId link must not carry a real
// editId — redact it so the view surface can't be used to derive edit access.
export function redactDeckEditId(deck: SavedDeck): SavedDeck {
  return { ...deck, editId: '' }
}

export function getDeckByEditId(editId: string): SavedDeck | null {
  const row = getDb().prepare('SELECT * FROM decks WHERE editId = ?').get(editId) as unknown as DeckRow | undefined
  return row ? rowToDeck(row) : null
}

interface CardJoinRow {
  publicId: string
  editId: string
  id: string
  templateId: string
  title: string
  manaCost: string
  typeLine: string
  rulesText: string
  flavorText: string
  showFlavorText: number
  powerToughness: string
  coverImage: string | null
  ogImage: string | null
  owner: string | null
  createdAt: string
  updatedAt: string
}

function rowToSavedCard(row: CardJoinRow): SavedCard {
  return {
    id: row.id,
    publicId: row.publicId,
    editId: row.editId,
    templateId: row.templateId,
    title: row.title,
    manaCost: row.manaCost,
    typeLine: row.typeLine,
    rulesText: row.rulesText,
    flavorText: row.flavorText,
    showFlavorText: Boolean(row.showFlavorText),
    powerToughness: row.powerToughness,
    coverImage: row.coverImage ? JSON.parse(row.coverImage) : null,
    ogImage: row.ogImage ?? null,
    owner: row.owner ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function listCardsInDeck(deckPublicId: string): SavedCard[] {
  const rows = getDb()
    .prepare(`
      SELECT cards.* FROM cards
      JOIN deck_cards ON deck_cards.cardPublicId = cards.publicId
      WHERE deck_cards.deckPublicId = ?
      ORDER BY deck_cards.addedAt ASC
    `)
    .all(deckPublicId) as unknown as CardJoinRow[]
  return rows.map(rowToSavedCard).map(redactEditId)
}

export function listCardPreviewsForDecks(deckPublicIds: string[], limit = 3): Record<string, SavedCard[]> {
  const db = getDb()
  const result: Record<string, SavedCard[]> = {}
  for (const deckPublicId of deckPublicIds) {
    const rows = db
      .prepare(`
        SELECT cards.* FROM cards
        JOIN deck_cards ON deck_cards.cardPublicId = cards.publicId
        WHERE deck_cards.deckPublicId = ?
        ORDER BY deck_cards.addedAt ASC
        LIMIT ?
      `)
      .all(deckPublicId, limit) as unknown as CardJoinRow[]
    result[deckPublicId] = rows.map(rowToSavedCard).map(redactEditId)
  }
  return result
}

export function addCardToDeck(deckPublicId: string, cardPublicId: string, owner: string | null): void {
  assertDeckOwnership(getDeckByPublicId(deckPublicId), owner)
  getDb()
    .prepare(`
      INSERT INTO deck_cards (deckPublicId, cardPublicId, addedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(deckPublicId, cardPublicId) DO NOTHING
    `)
    .run(deckPublicId, cardPublicId, new Date().toISOString())
}

export function removeCardFromDeck(deckPublicId: string, cardPublicId: string, owner: string | null): void {
  assertDeckOwnership(getDeckByPublicId(deckPublicId), owner)
  getDb()
    .prepare('DELETE FROM deck_cards WHERE deckPublicId = ? AND cardPublicId = ?')
    .run(deckPublicId, cardPublicId)
}

export function listDeckPublicIdsContainingCard(cardPublicId: string, deckPublicIds: string[]): string[] {
  if (deckPublicIds.length === 0) return []
  const placeholders = deckPublicIds.map(() => '?').join(', ')
  const rows = getDb()
    .prepare(`SELECT deckPublicId FROM deck_cards WHERE cardPublicId = ? AND deckPublicId IN (${placeholders})`)
    .all(cardPublicId, ...deckPublicIds) as unknown as Array<{ deckPublicId: string }>
  return rows.map((row) => row.deckPublicId)
}
