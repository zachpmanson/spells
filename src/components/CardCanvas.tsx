import { forwardRef } from 'react'
import type { Card } from '../types/card'
import { getTemplate } from '../templates/templates'
import { TextLayer } from './fields/TextLayer'
import { ImageLayer } from './fields/ImageLayer'
import { useCardStore } from '../lib/cardStore'

interface CardCanvasProps {
  card: Card
  autoGenerateImage?: boolean
  imageModel?: string
  textModel?: string
  style?: string
  readOnly?: boolean
  transitionName?: string
}

export const CardCanvas = forwardRef<HTMLDivElement, CardCanvasProps>(function CardCanvas(
  { card, autoGenerateImage, imageModel, textModel, style, readOnly = false, transitionName },
  ref,
) {
  const updateField = useCardStore((s) => s.updateField)
  const setCoverImage = useCardStore((s) => s.setCoverImage)
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
      ref={ref}
      className="card-canvas"
      style={{
        position: 'relative',
        width: '100%',
        aspectRatio: `${template.aspectRatio}`,
        backgroundColor: '#1a1a1a',
        overflow: 'hidden',
        viewTransitionName: transitionName,
      }}
    >
      <ImageLayer
        box={template.fields.coverImage}
        coverImage={card.coverImage}
        onChange={setCoverImage}
        autoGenerate={autoGenerateImage}
        imageModel={imageModel}
        textModel={textModel}
        style={style}
        readOnly={readOnly}
        genPrompt={{
          title: card.title,
          typeLine: card.typeLine,
          rulesText: card.rulesText,
          flavorText: card.flavorText,
        }}
      />
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
      <TextLayer
        box={template.fields.title}
        value={card.title}
        placeholder="Card title"
        onChange={(v) => updateField('title', v)}
        className="field-title"
        readOnly={readOnly}
      />
      <TextLayer
        box={template.fields.manaCost}
        value={card.manaCost}
        placeholder="{2}{U}"
        onChange={(v) => updateField('manaCost', v)}
        className="field-mana-cost"
        readOnly={readOnly}
      />
      <TextLayer
        box={template.fields.typeLine}
        value={card.typeLine}
        placeholder="Creature — Wizard"
        onChange={(v) => updateField('typeLine', v)}
        className="field-type-line"
        readOnly={readOnly}
      />
      <TextLayer
        box={rulesTextBox}
        value={card.rulesText}
        placeholder="Rules text"
        onChange={(v) => updateField('rulesText', v)}
        multiline
        autoShrink
        className="field-rules-text"
        readOnly={readOnly}
      />
      {showFlavorText && template.fields.flavorText && (
        <TextLayer
          box={template.fields.flavorText}
          value={card.flavorText}
          placeholder="Flavor text"
          onChange={(v) => updateField('flavorText', v)}
          multiline
          autoShrink
          className="field-flavor-text"
          readOnly={readOnly}
        />
      )}
      {template.fields.powerToughness && (
        <TextLayer
          box={template.fields.powerToughness}
          value={card.powerToughness}
          placeholder="0/0"
          onChange={(v) => updateField('powerToughness', v)}
          className="field-power-toughness"
          readOnly={readOnly}
        />
      )}
    </div>
  )
})
