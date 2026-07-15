import { DatabaseSync } from 'node:sqlite'
import { mkdirSync } from 'node:fs'
import path from 'node:path'
import type { Card } from '../types/card'
import { getDataDir } from './dataDir'

let db: DatabaseSync | null = null

function getDb(): DatabaseSync {
  if (db) return db

  mkdirSync(getDataDir(), { recursive: true })
  db = new DatabaseSync(path.join(getDataDir(), 'cards.sqlite'))
  db.exec(`
    CREATE TABLE IF NOT EXISTS cards (
      id TEXT PRIMARY KEY,
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
  return db
}

interface CardRow {
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

function rowToCard(row: CardRow): Card & { createdAt: string; updatedAt: string } {
  return {
    id: row.id,
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
  const now = new Date().toISOString()
  getDb()
    .prepare(`
      INSERT INTO cards (id, templateId, title, manaCost, typeLine, rulesText, flavorText, showFlavorText, powerToughness, coverImage, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
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

export function listSavedCards(): Array<Card & { createdAt: string; updatedAt: string }> {
  const rows = getDb().prepare('SELECT * FROM cards ORDER BY updatedAt DESC').all() as unknown as CardRow[]
  return rows.map(rowToCard)
}

export function getSavedCard(id: string): (Card & { createdAt: string; updatedAt: string }) | null {
  const row = getDb().prepare('SELECT * FROM cards WHERE id = ?').get(id) as unknown as CardRow | undefined
  return row ? rowToCard(row) : null
}

export function listSavedCardIds(): string[] {
  const rows = getDb().prepare('SELECT id FROM cards').all() as unknown as Array<{ id: string }>
  return rows.map((row) => row.id)
}
