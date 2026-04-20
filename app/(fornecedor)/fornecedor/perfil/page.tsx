'use client'

import { useState, useEffect, useRef } from 'react'
import { Star, MapPin, Globe, Phone, CheckCircle2, Save, Loader2, Upload, X } from 'lucide-react'
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

const SEGMENTS = ['Marcenaria', 'Elétrica', 'Vidraçaria', 'Gesseiro', 'Pintura', 'Iluminação', 'Outro']

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#007AFF',
  Elétrica: '#34d399',
  Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316',
  Pintura: '#ef4444',
  Iluminação: '#007AFF',
  Outro: '#6b6b6b',
}

interface FormState {
  name: string
  segment: string
  city: string
  bio: string
  instagram: string
  whatsapp: string
  email: string
  cover_url: string
  image_url: string
  founded: string
}

export default function FornecedorPerfilPage() {
  const [form, setForm] = useState<FormState>({
    name: '', segment: 'Marcenaria', city: '', bio: '',
    instagram: '', whatsapp: '', email: '', cover_url: '', image_url: '', founded: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [fornecedorId, setFornecedorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [uploadingCover, setUploadingCover] = useState(false)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)
      setUserId(user.id)

      const { data } = await supabase
        .from('fornecedores')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (data) {
        setFornecedorId(data.id)
        setForm({
          name: data.nome ?? '',
          segment: data.segmento ?? 'Marcenaria',
          city: data.cidade ?? '',
          bio: data.bio ?? '',
          instagram: data.instagram ?? '',
          whatsapp: data.whatsapp ?? '',
          email: data.email ?? '',
          cover_url: data.cover_url ?? '',
          image_url: data.image_url ?? '',
          founded: data.founded ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  const set = (key: keyof FormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  async function uploadCover(file: File) {
    if (!userId) return
    setUploadingCover(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/cover.${ext}`
    const { error } = await supabase.storage.from('fornecedores').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('fornecedores').getPublicUrl(path)
      setForm(f => ({ ...f, cover_url: publicUrl }))
    }
    setUploadingCover(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !userId) return
    setSaving(true)

    const supabase = createClient()
    const slug = slugify(form.name)
    const payload = {
      user_id: userId,
      nome: form.name,
      segmento: form.segment,
      cidade: form.city,
      bio: form.bio,
      instagram: form.instagram,
      whatsapp: form.whatsapp,
      email: form.email,
      cover_url: form.cover_url,
      image_url: form.image_url,
      founded: form.founded,
      slug,
    }

    const { data, error } = fornecedorId
      ? await supabase.from('fornecedores').update(payload).eq('id', fornecedorId).select('id').single()
      : await supabase.from('fornecedores').insert(payload).select('id').single()

    if (!error && data) {
      setFornecedorId(data.id)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }
    setSaving(false)
  }

  const segColor = SEG_COLOR[form.segment] ?? '#6b6b6b'

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '32px 36px',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1a1a1a',
        background: '#f2f2f7',
      }}
    >
      <style>{`
        .pf-inp {
          width: 100%;
          background: #f2f2f7;
          border: 1px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #1a1a1a;
          font-size: 13.5px;
          outline: none;
          transition: border-color 0.15s;
          box-sizing: border-box;
          font-family: inherit;
        }
        .pf-inp:focus { border-color: #007AFF; }
        .pf-inp::placeholder { color: #8e8e93; }
        .pf-label { font-size: 11.5px; color: #6b6b6b; display: block; margin-bottom: 7px; font-weight: 600; }
        @keyframes spin { to { transform: rotate(360deg) } }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Meu Perfil</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>
          Edite as informações que aparecerão no seu perfil público
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start' }}>
        {/* ── Form ── */}
        <form onSubmit={handleSave}>
          <div
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 16,
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#8e8e93', textTransform: 'uppercase' as const, paddingBottom: 12, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              Informações da empresa
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="pf-label">Nome da empresa *</label>
                <input className="pf-inp" required value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="pf-label">Segmento *</label>
                <select className="pf-inp" value={form.segment} onChange={set('segment')}>
                  {SEGMENTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="pf-label">Cidade / Estado *</label>
                <input className="pf-inp" required value={form.city} onChange={set('city')} placeholder="São Paulo, SP" />
              </div>
              <div>
                <label className="pf-label">Ano de fundação</label>
                <input className="pf-inp" value={form.founded} onChange={set('founded')} placeholder="2010" />
              </div>
            </div>

            <div>
              <label className="pf-label">Bio / Apresentação *</label>
              <textarea
                className="pf-inp"
                required
                rows={4}
                value={form.bio}
                onChange={set('bio')}
                placeholder="Descreva sua empresa, diferenciais e especialidades..."
                style={{ resize: 'vertical' as const }}
              />
              <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 4, textAlign: 'right' as const }}>
                {form.bio.length}/500 caracteres
              </div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#8e8e93', textTransform: 'uppercase' as const, paddingTop: 8, paddingBottom: 12, borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              Contato e redes sociais
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="pf-label">Instagram</label>
                <input className="pf-inp" value={form.instagram} onChange={set('instagram')} placeholder="@empresa.exemplo" />
              </div>
              <div>
                <label className="pf-label">WhatsApp</label>
                <input className="pf-inp" value={form.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div>
              <label className="pf-label">E-mail de contato</label>
              <input className="pf-inp" type="email" value={form.email} onChange={set('email')} placeholder="contato@empresa.com.br" />
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', color: '#8e8e93', textTransform: 'uppercase' as const, paddingTop: 8, paddingBottom: 12, borderTop: '1px solid rgba(0,0,0,0.06)', borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
              Foto de capa
            </div>

            <div>
              <label className="pf-label">Imagem de capa</label>
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                style={{ display: 'none' }}
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) uploadCover(file)
                }}
              />
              {form.cover_url ? (
                <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', height: 100, border: '1px solid rgba(0,0,0,0.08)', marginBottom: 8 }}>
                  <img src={form.cover_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <button type="button" onClick={() => coverInputRef.current?.click()}
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <Upload size={12} /> Trocar
                    </button>
                    <button type="button" onClick={() => setForm(f => ({ ...f, cover_url: '' }))}
                      style={{ background: 'rgba(255,255,255,0.9)', border: 'none', borderRadius: 8, padding: '5px 12px', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, color: '#ef4444' }}>
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
                    padding: '18px', background: '#f2f2f7', cursor: 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  }}
                >
                  {uploadingCover ? <Loader2 size={18} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={18} color="#8e8e93" />}
                  <span style={{ fontSize: 12, color: '#8e8e93' }}>{uploadingCover ? 'Enviando...' : 'Clique para enviar imagem de capa'}</span>
                </button>
              )}
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4 }}>
              <button
                type="submit"
                disabled={saving || !form.name}
                style={{
                  background: saved ? 'rgba(52,211,153,0.12)' : saving ? 'rgba(0,122,255,0.4)' : '#007AFF',
                  color: saved ? '#34d399' : '#ffffff',
                  border: saved ? '1px solid rgba(52,211,153,0.25)' : 'none',
                  borderRadius: 10, padding: '12px 28px', fontSize: 14, fontWeight: 700,
                  cursor: saving || !form.name ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
                }}
              >
                {saved ? (
                  <><CheckCircle2 size={16} /> Perfil atualizado!</>
                ) : saving ? (
                  <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                ) : (
                  <><Save size={16} /> Salvar Alterações</>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* ── Preview card ── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12 }}>
            Pré-visualização do perfil
          </div>
          <div style={{ background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* Cover */}
            <div style={{ position: 'relative', height: 130 }}>
              {form.cover_url ? (
                <img src={form.cover_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#f2f2f7' }} />
              )}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />
              <div style={{ position: 'absolute', bottom: 12, left: 14, right: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ background: 'rgba(255,255,255,0.85)', border: `1px solid ${segColor}44`, color: segColor, fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20, backdropFilter: 'blur(4px)' } as React.CSSProperties}>
                    {form.segment}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: 'rgba(255,255,255,0.85)', fontSize: 10 }}>
                    <MapPin size={9} />
                    {form.city || 'Cidade, Estado'}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#ffffff', lineHeight: 1.2 }}>
                  {form.name || 'Nome da empresa'}
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={11} fill="#f97316" color="#f97316" />
                ))}
                <span style={{ fontSize: 12, color: '#f97316', fontWeight: 700, marginLeft: 2 }}>—</span>
                <span style={{ fontSize: 11, color: '#8e8e93' }}>sem avaliações</span>
              </div>

              <p style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }}>
                {form.bio || 'Sua bio aparecerá aqui...'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6b6b6b' }}>
                    <Globe size={11} color="#8e8e93" />
                    {form.instagram}
                  </div>
                )}
                {form.whatsapp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#6b6b6b' }}>
                    <Phone size={11} color="#8e8e93" />
                    {form.whatsapp}
                  </div>
                )}
              </div>

              <div style={{ marginTop: 14, background: '#007AFF', color: '#ffffff', borderRadius: 10, padding: '9px', fontSize: 12, fontWeight: 700, textAlign: 'center' as const }}>
                Solicitar Orçamento
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
