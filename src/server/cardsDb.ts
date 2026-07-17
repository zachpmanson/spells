import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Card } from '../types/card'
import { getDataDir } from './dataDir'

export type SavedCard = Omit<Card, 'publicId'> & { publicId: string; createdAt: string; updatedAt: string }

let db: DatabaseSync | null = null

function migrateLegacyIdPrimaryKey(instance: DatabaseSync): void {
  const columns = instance.prepare('PRAGMA table_info(cards)').all() as unknown as Array<{ name: string }>
  if (columns.length === 0 || columns.some((c) => c.name === 'publicId')) return

  // Pre-migration, `id` doubled as both the local card id and the public share
  // id, so every existing row's `id` is already the value its /card/$id link
  // uses — carry it forward as `publicId` so old links keep working.
  instance.exec(`
    ALTER TABLE cards RENAME TO cards_legacy;
    CREATE TABLE cards (
      publicId TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      templateId TEXT NOT NULL,
      title TEXT NOT NULL,
      manaCost TEXT NOT NULL,
      typeLine TEXT NOT NULL,
      rulesText TEXT NOT NULL,
      flavorText TEXT NOT NULL,
      showFlavorText INTEGER NOT NULL,
      powerToughness TEXT NOT NULL,
      coverImage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    INSERT INTO cards (publicId, id, templateId, title, manaCost, typeLine, rulesText, flavorText, showFlavorText, powerToughness, coverImage, createdAt, updatedAt)
      SELECT id, id, templateId, title, manaCost, typeLine, rulesText, flavorText, showFlavorText, powerToughness, coverImage, createdAt, updatedAt FROM cards_legacy;
    DROP TABLE cards_legacy;
  `)
}

function migrateAddEditId(instance: DatabaseSync): void {
  const columns = instance.prepare('PRAGMA table_info(cards)').all() as unknown as Array<{ name: string }>
  if (columns.length === 0 || columns.some((c) => c.name === 'editId')) return

  // Existing rows predate the edit-link mechanic, so they have no client-known
  // editId — mint a random one server-side. Anyone who created those cards
  // before this migration will need their old share/edit link re-issued.
  instance.exec(`
    ALTER TABLE cards RENAME TO cards_legacy;
    CREATE TABLE cards (
      publicId TEXT PRIMARY KEY,
      editId TEXT NOT NULL UNIQUE,
      id TEXT NOT NULL,
      templateId TEXT NOT NULL,
      title TEXT NOT NULL,
      manaCost TEXT NOT NULL,
      typeLine TEXT NOT NULL,
      rulesText TEXT NOT NULL,
      flavorText TEXT NOT NULL,
      showFlavorText INTEGER NOT NULL,
      powerToughness TEXT NOT NULL,
      coverImage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
    INSERT INTO cards (publicId, editId, id, templateId, title, manaCost, typeLine, rulesText, flavorText, showFlavorText, powerToughness, coverImage, createdAt, updatedAt)
      SELECT publicId, lower(hex(randomblob(16))), id, templateId, title, manaCost, typeLine, rulesText, flavorText, showFlavorText, powerToughness, coverImage, createdAt, updatedAt FROM cards_legacy;
    DROP TABLE cards_legacy;
  `)
}

function getDb(): DatabaseSync {
  if (db) return db

  mkdirSync(getDataDir(), { recursive: true })
  db = new DatabaseSync(path.join(getDataDir(), 'cards.sqlite'))
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      publicId TEXT PRIMARY KEY,
      editId TEXT NOT NULL UNIQUE,
      id TEXT NOT NULL,
      templateId TEXT NOT NULL,
      title TEXT NOT NULL,
      manaCost TEXT NOT NULL,
      typeLine TEXT NOT NULL,
      rulesText TEXT NOT NULL,
      flavorText TEXT NOT NULL,
      showFlavorText INTEGER NOT NULL,
      powerToughness TEXT NOT NULL,
      coverImage TEXT,
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    )
  `)
  migrateLegacyIdPrimaryKey(db)
  migrateAddEditId(db)
  return db
}

interface CardRow {
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
  createdAt: string
  updatedAt: string
}

function rowToCard(row: CardRow): SavedCard {
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
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export function upsertSavedCard(card: Card): void {
  if (!card.publicId) throw new Error('Card must have a publicId before it can be saved server-side')
  const existing = getSavedCard(card.publicId)
  if (existing && existing.editId !== card.editId) {
    throw new Error('Not authorized to edit this card')
  }
  const now = new Date().toISOString()
  getDb()
    .prepare(`
      INSERT INTO cards (publicId, editId, id, templateId, title, manaCost, typeLine, rulesText, flavorText, showFlavorText, powerToughness, coverImage, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(publicId) DO UPDATE SET
        id = excluded.id,
        templateId = excluded.templateId,
        title = excluded.title,
        manaCost = excluded.manaCost,
        typeLine = excluded.typeLine,
        rulesText = excluded.rulesText,
        flavorText = excluded.flavorText,
        showFlavorText = excluded.showFlavorText,
        powerToughness = excluded.powerToughness,
        coverImage = excluded.coverImage,
        updatedAt = excluded.updatedAt
    `)
    .run(
      card.publicId,
      card.editId,
      card.id,
      card.templateId,
      card.title,
      card.manaCost,
      card.typeLine,
      card.rulesText,
      card.flavorText,
      card.showFlavorText ? 1 : 0,
      card.powerToughness,
      card.coverImage ? JSON.stringify(card.coverImage) : null,
      now,
      now,
    )
}

export function listSavedCards(page = 0, pageSize = 24): { cards: SavedCard[]; total: number } {
  const rows = getDb()
    .prepare('SELECT * FROM cards ORDER BY updatedAt DESC LIMIT ? OFFSET ?')
    .all(pageSize, page * pageSize) as unknown as CardRow[]
  const { count } = getDb().prepare('SELECT COUNT(*) AS count FROM cards').get() as unknown as { count: number }
  return { cards: rows.map(rowToCard), total: count }
}

export function getSavedCard(publicId: string): SavedCard | null {
  const row = getDb().prepare('SELECT * FROM cards WHERE publicId = ?').get(publicId) as unknown as CardRow | undefined
  return row ? rowToCard(row) : null
}

export function getSavedCardByEditId(editId: string): SavedCard | null {
  const row = getDb().prepare('SELECT * FROM cards WHERE editId = ?').get(editId) as unknown as CardRow | undefined
  return row ? rowToCard(row) : null
}

export function listSavedCardIds(): string[] {
  const rows = getDb().prepare('SELECT publicId FROM cards').all() as unknown as Array<{ publicId: string }>
  return rows.map((row) => row.publicId)
}

// Cards reachable through a read-only link (public view, deck listings) must
// not carry a real editId — redact it so the view surface can't be used to
// derive edit access.
export function redactEditId<T extends { editId: string }>(card: T): T {
  return { ...card, editId: '' }
}
