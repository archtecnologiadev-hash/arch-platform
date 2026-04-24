'use client'

import { useRef, useState } from 'react'
import { Camera, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import ImageCropModal, { type CropConfig } from './ImageCropModal'

interface Props {
  projectId: string
  hasCover: boolean
  onUpdate: (url: string) => void
  /** CSS class applied to the button — use to control hover-visibility via parent CSS */
  btnClassName?: string
}

export default function CoverUploadButton({ projectId, hasCover, onUpdate, btnClassName }: Props) {
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

      <button
        className={btnClassName}
        onClick={open}
        title={hasCover ? 'Editar capa' : 'Adicionar capa'}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          width: 30,
          height: 30,
          borderRadius: '50%',
          background: hasCover ? 'rgba(0,0,0,0.48)' : 'rgba(0,122,255,0.15)',
          border: hasCover ? '1px solid rgba(255,255,255,0.18)' : '1.5px solid rgba(0,122,255,0.35)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'background 0.15s, transform 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = hasCover ? 'rgba(0,0,0,0.65)' : 'rgba(0,122,255,0.28)'
          e.currentTarget.style.transform = 'scale(1.1)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = hasCover ? 'rgba(0,0,0,0.48)' : 'rgba(0,122,255,0.15)'
          e.currentTarget.style.transform = 'scale(1)'
        }}
      >
        {uploading
          ? <Loader2 size={13} color={hasCover ? '#fff' : '#007AFF'} style={{ animation: 'spin 0.8s linear infinite' }} />
          : <Camera size={13} color={hasCover ? '#fff' : '#007AFF'} />
        }
      </button>

      {crop && <ImageCropModal {...crop} />}
    </>
  )
}
