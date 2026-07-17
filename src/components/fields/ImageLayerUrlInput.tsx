interface ImageLayerUrlInputProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
}

export function ImageLayerUrlInput({ value, onChange, onSubmit }: ImageLayerUrlInputProps) {
  return (
    <div className="image-layer-url-input">
      <input
        type="text"
        placeholder="https://example.com/image.png"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
        }}
      />
      <button type="button" className="btn-overlay" onClick={onSubmit}>
        Use
      </button>
    </div>
  )
}
