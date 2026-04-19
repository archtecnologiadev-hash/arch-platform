'use client'

import { useState, useEffect } from 'react'
import { Save, ExternalLink, CheckCircle2, Loader2 } from 'lucide-react'
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
}

const ESTILOS = ['Contemporâneo', 'Minimalista', 'Clássico', 'Residencial', 'Comercial', 'Sustentável', 'Urbanismo', 'Industrial']
const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']

const inp: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: '#111',
  border: '1px solid #222', color: '#e8e8e8', fontSize: 13.5,
  outline: 'none', boxSizing: 'border-box', borderRadius: 6,
}
const lbl: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#555',
  marginBottom: 6, letterSpacing: '0.08em', fontWeight: 600,
}

export default function ArquitetoPerfilPage() {
  const [form, setForm] = useState<FormState>({
    nome: '', cidade: '', estado: '', estilo: '', bio: '', telefone: '', instagram: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

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
      <label style={lbl}>{label.toUpperCase()}</label>
      {opts?.textarea ? (
        <textarea
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          placeholder={opts.placeholder}
          rows={4}
          style={{ ...inp, resize: 'vertical', lineHeight: 1.6 }}
          onFocus={e => (e.target.style.borderColor = '#c8a96e')}
          onBlur={e => (e.target.style.borderColor = '#222')}
        />
      ) : (
        <input
          type={opts?.type ?? 'text'}
          value={form[key]}
          onChange={e => set(key, e.target.value)}
          placeholder={opts?.placeholder}
          style={inp}
          onFocus={e => (e.target.style.borderColor = '#c8a96e')}
          onBlur={e => (e.target.style.borderColor = '#222')}
        />
      )}
    </div>
  )

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#080808', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#c8a96e" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#080808', color: '#e0e0e0', padding: '32px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f0f0f0', marginBottom: 4 }}>Meu Perfil</h1>
          <p style={{ fontSize: 13, color: '#444' }}>
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
              fontSize: 12, color: '#c8a96e', textDecoration: 'none',
              border: '1px solid rgba(200,169,110,0.25)',
              padding: '8px 14px', borderRadius: 8,
              background: 'rgba(200,169,110,0.06)',
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
          <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, padding: 28 }}>

            <div style={{ marginBottom: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#c8a96e', letterSpacing: '0.1em', marginBottom: 16 }}>
                INFORMAÇÕES DO ESCRITÓRIO
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {field('Nome do escritório', 'nome', { placeholder: 'Ex: Estúdio Brasilis' })}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
                  {field('Cidade', 'cidade', { placeholder: 'São Paulo' })}
                  <div>
                    <label style={lbl}>ESTADO</label>
                    <select
                      value={form.estado}
                      onChange={e => set('estado', e.target.value)}
                      style={{ ...inp, cursor: 'pointer' }}
                      onFocus={e => (e.target.style.borderColor = '#c8a96e')}
                      onBlur={e => (e.target.style.borderColor = '#222')}
                    >
                      <option value="">—</option>
                      {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={lbl}>ESPECIALIDADE / ESTILO</label>
                  <select
                    value={form.estilo}
                    onChange={e => set('estilo', e.target.value)}
                    style={{ ...inp, cursor: 'pointer' }}
                    onFocus={e => (e.target.style.borderColor = '#c8a96e')}
                    onBlur={e => (e.target.style.borderColor = '#222')}
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

            <div style={{ borderTop: '1px solid #1c1c1c', paddingTop: 22 }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: '#c8a96e', letterSpacing: '0.1em', marginBottom: 16 }}>
                CONTATO
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {field('Telefone / WhatsApp', 'telefone', { placeholder: '(11) 99999-9999' })}
                {field('Instagram', 'instagram', { placeholder: '@seu.escritorio' })}
              </div>
            </div>
          </div>

          {/* Right — preview + save */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Preview card */}
            <div style={{ background: '#0d0d0d', border: '1px solid #1c1c1c', borderRadius: 14, padding: 22 }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#444', letterSpacing: '0.1em', marginBottom: 16 }}>
                PREVIEW DA LISTAGEM
              </p>
              <div style={{ border: '1px solid #1c1c1c', borderRadius: 10, overflow: 'hidden', background: '#111' }}>
                <div style={{ height: 100, background: '#181818', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ fontSize: 11, color: '#333' }}>Imagem de capa</span>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: form.nome ? '#e8e8e8' : '#333', marginBottom: 4 }}>
                    {form.nome || 'Nome do escritório'}
                  </div>
                  <div style={{ fontSize: 11, color: '#444', marginBottom: 10 }}>
                    {form.estilo || 'Especialidade'}
                  </div>
                  {(form.cidade || form.estado) && (
                    <div style={{ fontSize: 11, color: '#555' }}>
                      {[form.cidade, form.estado].filter(Boolean).join(', ')}
                    </div>
                  )}
                  {publicUrl && (
                    <div style={{ marginTop: 12, padding: '6px 10px', background: '#0a0a0a', borderRadius: 6 }}>
                      <span style={{ fontSize: 10, color: '#3a3a3a', fontFamily: 'monospace' }}>
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
                background: saved ? 'rgba(52,211,153,0.15)' : saving ? '#1a1a1a' : '#c8a96e',
                color: saved ? '#34d399' : saving ? '#555' : '#0d0d0d',
                border: saved ? '1px solid rgba(52,211,153,0.3)' : 'none',
                borderRadius: 8, fontSize: 13, fontWeight: 700,
                letterSpacing: '0.1em', cursor: saving || !form.nome ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                transition: 'all 0.2s',
              }}
            >
              {saved ? (
                <><CheckCircle2 size={15} /> PERFIL SALVO</>
              ) : saving ? (
                <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> SALVANDO...</>
              ) : (
                <><Save size={15} /> SALVAR PERFIL</>
              )}
            </button>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>

            {!form.nome && (
              <p style={{ fontSize: 11, color: '#333', textAlign: 'center' }}>
                Preencha o nome do escritório para salvar
              </p>
            )}
          </div>
        </div>
      </form>
    </div>
  )
}
