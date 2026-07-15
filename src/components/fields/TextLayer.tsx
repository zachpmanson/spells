import { useEffect, useRef } from 'react'
import type { BoxCoords } from '../../types/card'
import { sanitizeInlineHtml } from '../../lib/sanitizeInlineHtml'

interface TextLayerProps {
  box: BoxCoords
  value: string
  placeholder: string
  onChange: (value: string) => void
  multiline?: boolean
  autoShrink?: boolean
  className?: string
}

export function TextLayer({
  box,
  value,
  placeholder,
  onChange,
  multiline = false,
  autoShrink = false,
  className,
}: TextLayerProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autoShrink || !ref.current) return
    const el = ref.current
    let fontSize = 16
    el.style.fontSize = `${fontSize}px`
    while (el.scrollHeight > el.clientHeight && fontSize > 8) {
      fontSize -= 0.5
      el.style.fontSize = `${fontSize}px`
    }
  }, [value, autoShrink])

  return (
    <div
      className={`text-layer ${className ?? ''}`}
      style={{
        position: 'absolute',
        left: `${box.xPct}%`,
        top: `${box.yPct}%`,
        width: `${box.widthPct}%`,
        height: `${box.heightPct}%`,
      }}
    >
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onBlur={(e) => onChange(sanitizeInlineHtml(e.currentTarget.innerHTML))}
        onKeyDown={(e) => {
          if (!multiline && e.key === 'Enter') {
            e.preventDefault()
            return
          }
          const withModifier = e.metaKey || e.ctrlKey
          if (!withModifier) return
          if (e.key === 'b' || e.key === 'B') {
            e.preventDefault()
            document.execCommand('bold')
          } else if (e.key === 'i' || e.key === 'I') {
            e.preventDefault()
            document.execCommand('italic')
          }
        }}
        className="text-layer-content"
        dangerouslySetInnerHTML={{ __html: value }}
      />
    </div>
  )
}
