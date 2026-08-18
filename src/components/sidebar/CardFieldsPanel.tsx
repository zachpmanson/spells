import { useRef } from 'react'
import type { Card } from '../../types/card'
import { useCardStore } from '../../lib/cardStore'
import { Button } from '../Button'

interface CardFieldsPanelProps {
  card: Card
}

export function CardFieldsPanel({ card }: CardFieldsPanelProps) {
  const updateField = useCardStore((s) => s.updateField)
  const setShowFlavorText = useCardStore((s) => s.setShowFlavorText)
  const skillFileInputRef = useRef<HTMLInputElement>(null)

  async function handleSkillFile(file: File) {
    updateField('skillBody', await file.text())
  }

  return (
    <div className="card-fields-panel">
      <label>
        Title
        <input value={card.title} onChange={(e) => updateField('title', e.target.value)} />
      </label>
      <label>
        Mana cost
        <input value={card.manaCost} onChange={(e) => updateField('manaCost', e.target.value)} />
      </label>
      <label>
        Type line
        <input value={card.typeLine} onChange={(e) => updateField('typeLine', e.target.value)} />
      </label>
      <label>
        Rules text
        <textarea
          rows={9}
          value={card.rulesText}
          onChange={(e) => updateField('rulesText', e.target.value)}
        />
      </label>
      <label className="flavor-text-label">
        <span className="flavor-text-label-row">
          Flavor text
          <span className="checkbox-inline">
            <input
              type="checkbox"
              checked={card.showFlavorText}
              onChange={(e) => setShowFlavorText(e.target.checked)}
            />
            Show on card
          </span>
        </span>
        <textarea
          rows={2}
          value={card.flavorText}
          onChange={(e) => updateField('flavorText', e.target.value)}
          disabled={!card.showFlavorText}
        />
      </label>
      <label className="skill-body-label">
        <span className="flavor-text-label-row">
          Skill body
          <Button size="sm" onClick={() => skillFileInputRef.current?.click()}>
            Load from file
          </Button>
          <input
            ref={skillFileInputRef}
            type="file"
            accept=".txt,.md,.markdown,.text"
            hidden
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleSkillFile(file)
              // Reset so picking the same file again still fires onChange.
              e.target.value = ''
            }}
          />
        </span>
        <textarea
          rows={9}
          className="skill-body-textarea"
          value={card.skillBody}
          onChange={(e) => updateField('skillBody', e.target.value)}
          placeholder="Paste the skill body here, or load it from a text file…"
        />
      </label>
    </div>
  )
}
