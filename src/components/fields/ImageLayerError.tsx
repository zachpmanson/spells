interface ImageLayerErrorProps {
  message: string
}

export function ImageLayerError({ message }: ImageLayerErrorProps) {
  return <div className="image-layer-error">{message}</div>
}
