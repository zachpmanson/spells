import type { Card } from '../../types/card'
import { useCardStore } from '../../lib/cardStore'

interface CardFieldsPanelProps {
  card: Card
}

export function CardFieldsPanel({ card }: CardFieldsPanelProps) {
  const updateField = useCardStore((s) => s.updateField)
  const setShowFlavorText = useCardStore((s) => s.setShowFlavorText)

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
      <label>
        Power / Toughness
        <input
          value={card.powerToughness}
          onChange={(e) => updateField('powerToughness', e.target.value)}
        />
      </label>
    </div>
  )
}
