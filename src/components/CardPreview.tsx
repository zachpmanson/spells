import type { Card } from '../types/card'
import { getTemplate } from '../templates/templates'

interface CardPreviewProps {
  card: Card
  transitionName?: string
}

export function CardPreview({ card, transitionName }: CardPreviewProps) {
  const template = getTemplate(card.templateId)
  const showFlavorText = card.showFlavorText && Boolean(template.fields.flavorText)

  const rulesTextBox =
    !showFlavorText && template.fields.flavorText
      ? {
          ...template.fields.rulesText,
          heightPct:
            template.fields.flavorText.yPct +
            template.fields.flavorText.heightPct -
            template.fields.rulesText.yPct,
        }
      : template.fields.rulesText

  return (
    <div
      className="card-canvas card-preview"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${template.aspectRatio}`,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
        viewTransitionName: transitionName,
      }}
    >
      {card.coverImage && (
        <img
          src={card.coverImage.dataUrl}
          alt=""
          style={{
            position: 'absolute',
            left: `${template.fields.coverImage.xPct}%`,
            top: `${template.fields.coverImage.yPct}%`,
            width: `${template.fields.coverImage.widthPct}%`,
            height: `${template.fields.coverImage.heightPct}%`,
            objectFit: 'cover',
            objectPosition: `${card.coverImage.offsetXPct}% ${card.coverImage.offsetYPct}%`,
          }}
        />
      )}
      {template.imagePath && (
        <img
          src={template.imagePath}
          alt=""
          className="template-frame"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
          }}
        />
      )}
      <div className="text-layer field-title" style={boxStyle(template.fields.title)}>
        <div className="text-layer-content" dangerouslySetInnerHTML={{ __html: card.title }} />
      </div>
      <div className="text-layer field-mana-cost" style={boxStyle(template.fields.manaCost)}>
        <div className="text-layer-content" dangerouslySetInnerHTML={{ __html: card.manaCost }} />
      </div>
      <div className="text-layer field-type-line" style={boxStyle(template.fields.typeLine)}>
        <div className="text-layer-content" dangerouslySetInnerHTML={{ __html: card.typeLine }} />
      </div>
      <div className="text-layer field-rules-text" style={boxStyle(rulesTextBox)}>
        <div className="text-layer-content" dangerouslySetInnerHTML={{ __html: card.rulesText }} />
      </div>
      {showFlavorText && template.fields.flavorText && (
        <div className="text-layer field-flavor-text" style={boxStyle(template.fields.flavorText)}>
          <div className="text-layer-content" dangerouslySetInnerHTML={{ __html: card.flavorText }} />
        </div>
      )}
      {template.fields.powerToughness && (
        <div className="text-layer field-power-toughness" style={boxStyle(template.fields.powerToughness)}>
          <div className="text-layer-content" dangerouslySetInnerHTML={{ __html: card.powerToughness }} />
        </div>
      )}
    </div>
  )
}

function boxStyle(box: { xPct: number; yPct: number; widthPct: number; heightPct: number }) {
  return {
    position: 'absolute' as const,
    left: `${box.xPct}%`,
    top: `${box.yPct}%`,
    width: `${box.widthPct}%`,
    height: `${box.heightPct}%`,
  }
}
