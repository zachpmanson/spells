interface ImageLayerLoadingProps {
  label: string
}

export function ImageLayerLoading({ label }: ImageLayerLoadingProps) {
  return (
    <div className="image-layer-loading">
      <div className="spinner" />
      <span>{label}</span>
    </div>
  )
}
