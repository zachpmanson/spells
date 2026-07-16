import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Deck } from '../types/deck'
import { getDataDir } from './dataDir'
import type { SavedCard } from './cardsDb'

let db: DatabaseSync | null = null

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
  return db
}

interface DeckRow {
  publicId: string
  editId: string
  id: string
  title: string
  createdAt: string
  updatedAt: string
}

export type SavedDeck = Deck & { createdAt: string; updatedAt: string }

function rowToDeck(row: DeckRow): SavedDeck {
  return {
    id: row.id,
    publicId: row.publicId,
    editId: row.editId,
    title: row.title,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function renameDeck(editId: string, title: string): void {
  getDb()
    .prepare('UPDATE decks SET title = ?, updatedAt = ? WHERE editId = ?')
    .run(title, new Date().toISOString(), editId)
}

export function upsertDeck(deck: Deck): void {
  const now = new Date().toISOString()
  getDb()
    .prepare(`
      INSERT INTO decks (publicId, editId, id, title, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?)
      ON CONFLICT(publicId) DO UPDATE SET
        title = excluded.title,
        updatedAt = excluded.updatedAt
    `)
    .run(deck.publicId, deck.editId, deck.id, deck.title, now, now)
}

export function getDeckByPublicId(publicId: string): SavedDeck | null {
  const row = getDb().prepare('SELECT * FROM decks WHERE publicId = ?').get(publicId) as unknown as DeckRow | undefined
  return row ? rowToDeck(row) : null
}

export function getDeckByEditId(editId: string): SavedDeck | null {
  const row = getDb().prepare('SELECT * FROM decks WHERE editId = ?').get(editId) as unknown as DeckRow | undefined
  return row ? rowToDeck(row) : null
}

interface CardJoinRow {
  publicId: string
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
  createdAt: string
  updatedAt: string
}

function rowToSavedCard(row: CardJoinRow): SavedCard {
  return {
    id: row.id,
    publicId: row.publicId,
    templateId: row.templateId,
    title: row.title,
    manaCost: row.manaCost,
    typeLine: row.typeLine,
    rulesText: row.rulesText,
    flavorText: row.flavorText,
    showFlavorText: Boolean(row.showFlavorText),
    powerToughness: row.powerToughness,
    coverImage: row.coverImage ? JSON.parse(row.coverImage) : null,
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
  return rows.map(rowToSavedCard)
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
    result[deckPublicId] = rows.map(rowToSavedCard)
  }
  return result
}

export function addCardToDeck(deckPublicId: string, cardPublicId: string): void {
  getDb()
    .prepare(`
      INSERT INTO deck_cards (deckPublicId, cardPublicId, addedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(deckPublicId, cardPublicId) DO NOTHING
    `)
    .run(deckPublicId, cardPublicId, new Date().toISOString())
}

export function removeCardFromDeck(deckPublicId: string, cardPublicId: string): void {
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
