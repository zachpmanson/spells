import { IMAGE_MODELS } from '../lib/imageModels'
import { TEXT_MODELS } from '../lib/textModels'
import { IMAGE_STYLES } from '../lib/imageStyles'
import { Button } from './Button'

interface ModelSettingsModalProps {
  onClose: () => void
  imageModel: string
  setImageModel: (value: string) => void
  textModel: string
  setTextModel: (value: string) => void
  style: string
  setStyle: (value: string) => void
}

export function ModelSettingsModal({
  onClose,
  imageModel,
  setImageModel,
  textModel,
  setTextModel,
  style,
  setStyle,
}: ModelSettingsModalProps) {
  return (
    <div className="model-settings-overlay" onClick={onClose}>
      <div className="model-settings-panel" onClick={(e) => e.stopPropagation()}>
        <div className="model-settings-header">
          <h3>Generation models</h3>
          <Button size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
        <label className="model-settings-field">
          Image model
          <select value={imageModel} onChange={(e) => setImageModel(e.target.value)}>
            {IMAGE_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
        <label className="model-settings-field">
          Text model
          <select value={textModel} onChange={(e) => setTextModel(e.target.value)}>
            {TEXT_MODELS.map((model) => (
              <option key={model.id} value={model.id}>
                {model.label}
              </option>
            ))}
          </select>
        </label>
        <label className="model-settings-field">
          Style
          <select value={style} onChange={(e) => setStyle(e.target.value)}>
            {IMAGE_STYLES.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}
