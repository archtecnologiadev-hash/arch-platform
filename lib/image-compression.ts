import imageCompression from 'browser-image-compression'

export interface ImageMeta {
  file: File
  largura: number
  altura: number
  tamanho_bytes: number
}

function getDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = new window.Image()
    const url = URL.createObjectURL(file)
    img.onload = () => { resolve({ width: img.naturalWidth, height: img.naturalHeight }); URL.revokeObjectURL(url) }
    img.onerror = () => { resolve({ width: 0, height: 0 }); URL.revokeObjectURL(url) }
    img.src = url
  })
}

export async function comprimirImagem(file: File, maxSizeMB = 1.5): Promise<ImageMeta> {
  const base = { maxSizeMB, maxWidthOrHeight: 4096, useWebWorker: true, initialQuality: 0.88 }

  let compressed: File
  try {
    const blob = await imageCompression(file, { ...base, fileType: 'image/webp' })
    compressed = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' })
  } catch {
    const blob = await imageCompression(file, base)
    compressed = new File([blob], file.name, { type: blob.type })
  }

  const { width, height } = await getDimensions(compressed)
  return { file: compressed, largura: width, altura: height, tamanho_bytes: compressed.size }
}
