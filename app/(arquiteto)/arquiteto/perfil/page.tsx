'use client'

import { useState, useEffect, useRef } from 'react'
import { Save, ExternalLink, CheckCircle2, Loader2, Upload, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

interface FormState {
  nome: string
  cidade: string
  estado: string
  estilo: string
  bio: string
  telefone: string
  instagram: string
  image_url: string
  cover_url: string
}

const ESTILOS = ['Contemporâneo', 'Minimalista', 'Clássico', 'Residencial', 'Comercial', 'Sustentável', 'Urbanismo', 'Industrial']
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', fontSize: 13.5,
  outline: 'none', boxSizing: 'border-box', borderRadius: 10,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#8e8e93',
  marginBottom: 6, letterSpacing: '0.04em', fontWeight: 400,
}

export default function ArquitetoPerfilPage() {
  const [form, setForm] = useState<FormState>({
    nome: '', cidade: '', estado: '', estilo: '', bio: '',
    telefone: '', instagram: '', image_url: '', cover_url: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)
      setUserId(user.id)

      const { data } = await supabase
        .from('escritorios')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setEscritorioId(data.id)
        setForm({
          nome: data.nome ?? '',
          cidade: data.cidade ?? '',
          estado: data.estado ?? '',
          estilo: data.estilo ?? '',
          bio: data.bio ?? '',
          telefone: data.telefone ?? '',
          instagram: data.instagram ?? '',
          image_url: data.image_url ?? '',
          cover_url: data.cover_url ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  async function uploadFile(file: File, field: 'image_url' | 'cover_url', setUploading: (v: boolean) => void) {
    if (!userId) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/${field === 'cover_url' ? 'cover' : 'photo'}.${ext}`
    const { error } = await supabase.storage.from('escritorios').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('escritorios').getPublicUrl(path)
      set(field, publicUrl)
    }
    setUploading(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome || !userId) return
    setSaving(true)

    const supabase = createClient()
    const slug = slugify(form.nome)
    const payload = { ...form, slug, user_id: userId }

    const { data, error } = escritorioId
      ? await supabase.from('escritorios').update(payload).eq('id', escritorioId).select('id').single()
      : await supabase.from('escritorios').insert(payload).select('id').single()

    if (!error && data) {
      setEscritorioId(data.id)
      setSaved(true)
    }
    setSaving(false)
  }

  const slug = slugify(form.nome)
  const publicUrl = form.nome ? `/escritorio/${slug}` : null

  const field = (
    label: string, key: keyof FormState,
    opts?: { type?: string; placeholder?: string; textarea?: boolean }
  ) => (
    <div>
      <label style={lbl}>{label}</label>
      {opts?.textarea ? (
        <textarea
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          placeholder={opts.placeholder}
          rows={4}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          placeholder={opts?.placeholder}
          style={inp}
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
        />
      )}
    </div>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a', padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Meu Perfil</h1>
          <p style={{ fontSize: 13, color: '#6b6b6b' }}>
            {escritorioId ? 'Edite as informações do seu escritório' : 'Configure seu perfil público para aparecer na plataforma'}
          </p>
        </div>
        {publicUrl && (
          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              fontSize: 12, color: '#007AFF', textDecoration: 'none',
              border: '1px solid rgba(0,122,255,0.2)',
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(0,122,255,0.06)',
            }}
          >
            <ExternalLink size={13} />
            Ver página pública
          </a>
        )}
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

          {/* Left — form */}
          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>

            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 16 }}>
                Informações do escritório
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {field('Nome do escritório', 'nome', { placeholder: 'Ex: Estúdio Brasilis' })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                  {field('Cidade', 'cidade', { placeholder: 'São Paulo' })}
                  <div>
                    <label style={lbl}>Estado</label>
                    <select
                      value={form.estado}
                      onChange={e => set('estado', e.target.value)}
                      style={{ ...inp, cursor: 'pointer' }}
                      onFocus={e => (e.target.style.borderColor = '#007AFF')}
                      onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                    >
                      <option value="">—</option>
                      {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>Especialidade / Estilo</label>
                  <select
                    value={form.estilo}
                    onChange={e => set('estilo', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => (e.target.style.borderColor = '#007AFF')}
                    onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                  >
                    <option value="">Selecione um estilo</option>
                    {ESTILOS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                {field('Bio / Apresentação', 'bio', {
                  textarea: true,
                  placeholder: 'Descreva seu escritório, filosofia de trabalho, diferenciais...',
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 22, marginBottom: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 16 }}>
                Contato
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {field('Telefone / WhatsApp', 'telefone', { placeholder: '(11) 99999-9999' })}
                {field('Instagram', 'instagram', { placeholder: '@seu.escritorio' })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 400, color: '#007AFF', letterSpacing: '0.04em', marginBottom: 16 }}>
                Imagens
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

                {/* Photo upload */}
                <div>
                  <label style={lbl}>Foto do escritório</label>
                  <input
                    ref={imageInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) uploadFile(file, 'image_url', setUploadingImage)
                    }}
                  />
                  {form.image_url ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <img src={form.image_url} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <button type="button" onClick={() => imageInputRef.current?.click()}
                          style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Upload size={12} /> Trocar
                        </button>
                        <button type="button" onClick={() => set('image_url', '')}
                          style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}>
                          <X size={12} /> Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => imageInputRef.current?.click()}
                      disabled={uploadingImage}
                      style={{
                        width: '100%', border: '1.5px dashed rgba(0,0,0,0.15)', borderRadius: 10,
                        padding: '20px', background: '#f2f2f7', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      }}
                    >
                      {uploadingImage ? <Loader2 size={18} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} color="#8e8e93" />}
                      <span style={{ fontSize: 12, color: '#8e8e93' }}>{uploadingImage ? 'Enviando...' : 'Clique para enviar foto'}</span>
                    </button>
                  )}
                </div>

                {/* Cover upload */}
                <div>
                  <label style={lbl}>Foto de capa</label>
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) uploadFile(file, 'cover_url', setUploadingCover)
                    }}
                  />
                  {form.cover_url ? (
                    <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 120, border: '1px solid rgba(0,0,0,0.08)' }}>
                      <img src={form.cover_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <div
                        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      >
                        <button type="button" onClick={() => coverInputRef.current?.click()}
                          style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                          <Upload size={12} /> Trocar
                        </button>
                        <button type="button" onClick={() => set('cover_url', '')}
                          style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '6px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}>
                          <X size={12} /> Remover
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => coverInputRef.current?.click()}
                      disabled={uploadingCover}
                      style={{
                        width: '100%', border: '1.5px dashed rgba(0,0,0,0.15)', borderRadius: 10,
                        padding: '20px', background: '#f2f2f7', cursor: 'pointer',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
                      }}
                    >
                      {uploadingCover ? <Loader2 size={18} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} color="#8e8e93" />}
                      <span style={{ fontSize: 12, color: '#8e8e93' }}>{uploadingCover ? 'Enviando...' : 'Clique para enviar capa'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right — preview + save */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Preview card */}
            <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 22, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
              <p style={{ fontSize: 11, fontWeight: 400, color: '#8e8e93', letterSpacing: '0.04em', marginBottom: 16 }}>
                Preview da listagem
              </p>
              <div style={{ border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, overflow: 'hidden', background: '#f2f2f7' }}>
                <div style={{ height: 100, background: '#e5e5ea', overflow: 'hidden' }}>
                  {form.cover_url || form.image_url ? (
                    <img
                      src={form.cover_url || form.image_url}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: '#8e8e93' }}>Imagem de capa</span>
                    </div>
                  )}
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: form.nome ? '#1a1a1a' : '#8e8e93', marginBottom: 4 }}>
                    {form.nome || 'Nome do escritório'}
                  </div>
                  <div style={{ fontSize: 11, color: '#6b6b6b', marginBottom: 10 }}>
                    {form.estilo || 'Especialidade'}
                  </div>
                  {(form.cidade || form.estado) && (
                    <div style={{ fontSize: 11, color: '#8e8e93' }}>
                      {[form.cidade, form.estado].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {publicUrl && (
                    <div style={{ marginTop: 12, padding: '6px 10px', background: '#f2f2f7', borderRadius: 6 }}>
                      <span style={{ fontSize: 10, color: '#8e8e93', fontFamily: 'monospace' }}>
                        /escritorio/{slug}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Save button */}
            <button
              type="submit"
              disabled={saving || !form.nome}
              style={{
                width: '100%', padding: '13px',
                background: saved ? 'rgba(52,211,153,0.12)' : saving ? 'rgba(0,122,255,0.4)' : '#007AFF',
                color: saved ? '#34d399' : '#ffffff',
                border: saved ? '1px solid rgba(52,211,153,0.25)' : 'none',
                borderRadius: 10, fontSize: 13, fontWeight: 400,
                letterSpacing: '0.04em', cursor: saving || !form.nome ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {saved ? (
                <><CheckCircle2 size={15} /> Perfil salvo</>
              ) : saving ? (
                <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              ) : (
                <><Save size={15} /> Salvar Perfil</>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

            {!form.nome && (
              <p style={{ fontSize: 11, color: '#8e8e93', textAlign: 'center' }}>
                Preencha o nome do escritório para salvar
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
