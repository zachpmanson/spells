import { useEffect, useRef, useState } from 'react'
import { CardCanvas } from './components/CardCanvas'
import { Toolbar } from './components/Toolbar'
import { CardFieldsPanel } from './components/sidebar/CardFieldsPanel'
import { TemplatePicker } from './components/sidebar/TemplatePicker'
import { ModelSettingsModal } from './components/ModelSettingsModal'
import { useCardStore } from './lib/cardStore'
import { useGenerationSettings } from './lib/generationSettings'

interface AppProps {
  autoGenerateImage?: boolean
}

function App({ autoGenerateImage }: AppProps) {
  const card = useCardStore((s) => s.card)
  const canvasRef = useRef<HTMLDivElement>(null)
  const [showModelSettings, setShowModelSettings] = useState(false)
  const generationSettings = useGenerationSettings()

  useEffect(() => {
    // Make Enter insert <br> instead of wrapping each line in its own <div>/<p>,
    // so contentEditable output matches what sanitizeInlineHtml expects.
    document.execCommand('defaultParagraphSeparator', false, 'br')
  }, [])

  return (
    <div className="app-layout">
      <Toolbar canvasRef={canvasRef} />
      <button
        type="button"
        className="btn-overlay btn-icon app-settings-btn"
        onClick={() => setShowModelSettings(true)}
        title="Model settings"
        aria-label="Model settings"
      >
        ⚙
      </button>
      <div className="app-body">
        <aside className="app-sidebar">
          <TemplatePicker templateId={card.templateId} />
          <CardFieldsPanel card={card} />
        </aside>
        <main className="app-canvas-area">
          <div className="app-canvas-wrapper">
            <CardCanvas
              ref={canvasRef}
              card={card}
              autoGenerateImage={autoGenerateImage}
              imageModel={generationSettings.imageModel}
              textModel={generationSettings.textModel}
              style={generationSettings.style}
            />
          </div>
        </main>
      </div>
      {showModelSettings && (
        <ModelSettingsModal onClose={() => setShowModelSettings(false)} {...generationSettings} />
      )}
    </div>
  )
}

export default App
