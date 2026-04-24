'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ImageCropModal, { type CropConfig } from './ImageCropModal'

interface Props {
  projectId: string
  hasCover: boolean
  onUpdate: (url: string) => void
}

export default function CoverUploadButton({ projectId, hasCover, onUpdate }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [crop, setCrop] = useState<CropConfig | null>(null)
  const [uploading, setUploading] = useState(false)

  function open(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    inputRef.current?.click()
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const src = URL.createObjectURL(file)
    e.target.value = ''
    setCrop({
      src,
      aspect: 16 / 9,
      onConfirm: async (blob) => {
        setCrop(null)
        URL.revokeObjectURL(src)
        setUploading(true)
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setUploading(false); return }
        const path = `${user.id}/covers/${projectId}_${Date.now()}.jpg`
        const { error } = await supabase.storage
          .from('projetos')
          .upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('projetos').getPublicUrl(path)
          await supabase.from('projetos').update({ cover_url: publicUrl }).eq('id', projectId)
          onUpdate(publicUrl)
        }
        setUploading(false)
      },
      onCancel: () => { setCrop(null); URL.revokeObjectURL(src) },
    })
  }

  return (
    <>
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFile} />

      {hasCover ? (
        <button
          className="cover-edit-btn"
          onClick={open}
          title="Editar capa"
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.32)',
            border: 'none', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 7, zIndex: 4,
          }}
        >
          {uploading ? (
            <Loader2 size={22} color="#ffffff" style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>
              <div style={{
                width: 38, height: 38, borderRadius: '50%',
                background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={16} color="#007AFF" />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#fff', letterSpacing: '0.02em', textShadow: '0 1px 4px rgba(0,0,0,0.5)' }}>
                Editar capa
              </span>
            </>
          )}
        </button>
      ) : (
        <button
          onClick={open}
          title="Adicionar capa"
          style={{
            position: 'absolute', inset: 0, border: 'none', cursor: 'pointer',
            background: 'transparent',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 8, zIndex: 4, transition: 'background 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,122,255,0.09)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
        >
          {uploading ? (
            <Loader2 size={22} color="#007AFF" style={{ animation: 'spin 0.8s linear infinite' }} />
          ) : (
            <>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: 'rgba(0,122,255,0.1)', border: '1.5px solid rgba(0,122,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Camera size={18} color="#007AFF" />
              </div>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: '#007AFF' }}>Adicionar capa</span>
            </>
          )}
        </button>
      )}

      {crop && <ImageCropModal {...crop} />}
    </>
  )
}
