import { TEMPLATES } from '../../templates/templates'
import { useCardStore } from '../../lib/cardStore'

export function TemplatePicker({ templateId }: { templateId: string }) {
  const setTemplate = useCardStore((s) => s.setTemplate)

  return (
    <div className="template-picker">
      <label>
        Template
        <select value={templateId} onChange={(e) => setTemplate(e.target.value)}>
          {TEMPLATES.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
