'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Star, MapPin, Globe, Phone, CheckCircle2, Save, Loader2, Camera, X, ImagePlus, CreditCard, ArrowRight, Zap } from 'lucide-react'
import WelcomeBanner from '@/components/WelcomeBanner'
import { createClient } from '@/lib/supabase'
import ImageCropModal, { type CropConfig } from '@/components/shared/ImageCropModal'
import { usePlan } from '@/hooks/usePlan'

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
  Marcenaria: '#007AFF', Elétrica: '#34d399', Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316', Pintura: '#ef4444', Iluminação: '#007AFF', Outro: '#6b6b6b',
}

interface FormState {
  name: string; segment: string; city: string; bio: string
  instagram: string; whatsapp: string; email: string; website: string
  cover_url: string; image_url: string; founded: string
}

const INP: React.CSSProperties = {
  width: '100%', background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10, padding: '10px 14px', color: '#1a1a1a', fontSize: 13.5,
  outline: 'none', transition: 'border-color 0.15s', boxSizing: 'border-box',
  fontFamily: 'inherit',
}
const LBL: React.CSSProperties = {
  fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 7, fontWeight: 600,
}

export default function FornecedorPerfilPage() {
  const [form, setForm] = useState<FormState>({
    name: '', segment: 'Marcenaria', city: '', bio: '',
    instagram: '', whatsapp: '', email: '', website: '',
    cover_url: '', image_url: '', founded: '',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [fornecedorId, setFornecedorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [cropConfig, setCropConfig] = useState<CropConfig | null>(null)
  const planInfo = usePlan()

  const logoInputRef = useRef<HTMLInputElement>(null)
  const coverInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)
      setUserId(user.id)

      const { data } = await supabase
        .from('fornecedores').select('*').eq('user_id', user.id).maybeSingle()

      if (data) {
        setFornecedorId(data.id)
        setForm({
          name:      data.nome       ?? '',
          segment:   data.segmento   ?? 'Marcenaria',
          city:      data.cidade     ?? '',
          bio:       data.bio        ?? '',
          instagram: data.instagram  ?? '',
          whatsapp:  data.whatsapp   ?? '',
          email:     data.email      ?? '',
          website:   data.website    ?? '',
          cover_url: data.cover_url  ?? '',
          image_url: data.image_url  ?? '',
          founded:   data.founded    ?? '',
        })
      }
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))

  async function uploadToStorage(blob: Blob, path: string): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.storage
      .from('fornecedores').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
    if (error) {
      // Auto-create bucket if missing and retry
      if (error.message.includes('not found') || error.message.includes('Bucket')) {
        await supabase.storage.createBucket('fornecedores', { public: true })
        const retry = await supabase.storage
          .from('fornecedores').upload(path, blob, { upsert: true, contentType: 'image/jpeg' })
        if (retry.error) return null
      } else {
        return null
      }
    }
    const { data: { publicUrl } } = supabase.storage.from('fornecedores').getPublicUrl(path)
    return publicUrl
  }

  function openLogoCrop(file: File) {
    const src = URL.createObjectURL(file)
    setCropConfig({
      src, aspect: 1, circular: true,
      onConfirm: async blob => {
        setCropConfig(null)
        if (!userId) return
        const url = await uploadToStorage(blob, `${userId}/logo_${Date.now()}.jpg`)
        if (url) setForm(f => ({ ...f, image_url: url }))
      },
      onCancel: () => setCropConfig(null),
    })
  }

  function openCoverCrop(file: File) {
    const src = URL.createObjectURL(file)
    setCropConfig({
      src, aspect: 16 / 5, circular: false,
      onConfirm: async blob => {
        setCropConfig(null)
        if (!userId) return
        const url = await uploadToStorage(blob, `${userId}/cover_${Date.now()}.jpg`)
        if (url) setForm(f => ({ ...f, cover_url: url }))
      },
      onCancel: () => setCropConfig(null),
    })
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name || !userId) return
    setSaving(true)

    const supabase = createClient()
    const slug = slugify(form.name)
    const payload = {
      user_id:   userId,
      nome:      form.name,
      segmento:  form.segment,
      cidade:    form.city,
      bio:       form.bio,
      instagram: form.instagram,
      whatsapp:  form.whatsapp,
      email:     form.email,
      website:   form.website,
      cover_url: form.cover_url || null,
      image_url: form.image_url || null,
      founded:   form.founded  || null,
      slug,
    }

    const { data, error } = fornecedorId
      ? await supabase.from('fornecedores').update(payload).eq('id', fornecedorId).select('id').single()
      : await supabase.from('fornecedores').insert(payload).select('id').single()

    if (!error && data) {
      if (!fornecedorId) setFornecedorId(data.id)
      showToast('Perfil atualizado com sucesso!')
    } else {
      console.error('[fornecedor perfil] save error:', error)
      showToast(error?.message ?? 'Erro ao salvar. Tente novamente.', false)
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
    <div style={{ padding: '32px 36px', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', background: '#f2f2f7' }}>
      <style>{`
        .pf-inp:focus { border-color: #007AFF !important; }
        .pf-inp::placeholder { color: #8e8e93; }
        @keyframes spin { to { transform: rotate(360deg) } }
        @keyframes slideDown { from { opacity:0; transform:translateY(-10px) } to { opacity:1; transform:translateY(0) } }
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1c1c1e', color: '#fff', padding: '12px 20px', borderRadius: 12,
          fontSize: 13, zIndex: 9999, animation: 'slideDown 0.2s ease',
          display: 'flex', alignItems: 'center', gap: 8,
          boxShadow: '0 8px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap',
        }}>
          {toast.ok
            ? <CheckCircle2 size={15} color="#34d399" />
            : <X size={15} color="#ff3b30" />}
          {toast.msg}
        </div>
      )}

      {/* Crop Modal */}
      {cropConfig && <ImageCropModal {...cropConfig} />}

      {/* Hidden file inputs */}
      <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) openLogoCrop(f); e.target.value = '' }} />
      <input ref={coverInputRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) openCoverCrop(f); e.target.value = '' }} />

      <WelcomeBanner text="Bem-vindo à ARC! Complete seu perfil para aparecer no diretório de fornecedores e receber solicitações de orçamento." />

      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Meu Perfil</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>
          Edite as informações que aparecerão no seu perfil público
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start' }}>

        {/* ── Form ── */}
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Cover + Logo */}
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* Cover area */}
            <div
              onClick={() => coverInputRef.current?.click()}
              style={{ position: 'relative', height: 140, cursor: 'pointer', background: form.cover_url ? 'transparent' : 'linear-gradient(135deg, #e8e8f0, #d0d0dc)', overflow: 'hidden' }}
            >
              {form.cover_url
                ? <img src={form.cover_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <ImagePlus size={22} color="#8e8e93" />
                    <span style={{ fontSize: 12, color: '#8e8e93' }}>Clique para adicionar foto de capa</span>
                  </div>}
              <div style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)', borderRadius: 8, padding: '5px 11px', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Camera size={11} color="#fff" />
                <span style={{ fontSize: 11, color: '#fff' }}>Trocar capa</span>
              </div>
            </div>

            {/* Logo + name row */}
            <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -36 }}>
              <div
                onClick={() => logoInputRef.current?.click()}
                title="Trocar logo"
                style={{ width: 72, height: 72, borderRadius: '50%', border: '3px solid #fff', background: form.image_url ? 'transparent' : '#e5e5ea', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.18)' }}
              >
                {form.image_url
                  ? <img src={form.image_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={20} color="#8e8e93" />
                    </div>}
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.18s', borderRadius: '50%' }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                  <Camera size={15} color="#fff" />
                </div>
              </div>
              <div style={{ paddingBottom: 4 }}>
                <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{form.name || <span style={{ color: '#c7c7cc' }}>Nome da empresa</span>}</div>
                {form.city && <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>{form.city}</div>}
              </div>
            </div>
          </div>

          {/* Informações */}
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#8e8e93', textTransform: 'uppercase' }}>Informações da empresa</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LBL}>Nome da empresa *</label>
                <input style={INP} className="pf-inp" required value={form.name} onChange={set('name')} placeholder="Ex: Marcenaria Silva" />
              </div>
              <div>
                <label style={LBL}>Segmento *</label>
                <select style={INP} className="pf-inp" value={form.segment} onChange={set('segment')}>
                  {SEGMENTS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LBL}>Cidade / Estado *</label>
                <input style={INP} className="pf-inp" required value={form.city} onChange={set('city')} placeholder="São Paulo, SP" />
              </div>
              <div>
                <label style={LBL}>Ano de fundação</label>
                <input style={INP} className="pf-inp" value={form.founded} onChange={set('founded')} placeholder="2010" />
              </div>
            </div>

            <div>
              <label style={LBL}>Bio / Apresentação <span style={{ color: form.bio.length > 460 ? '#ff9500' : '#c7c7cc' }}>{form.bio.length}/500</span></label>
              <textarea style={{ ...INP, resize: 'vertical', lineHeight: 1.65 }} className="pf-inp" rows={4}
                value={form.bio} onChange={set('bio')}
                placeholder="Descreva sua empresa, diferenciais e especialidades..." />
            </div>
          </div>

          {/* Contato */}
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 24, display: 'flex', flexDirection: 'column', gap: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: '#8e8e93', textTransform: 'uppercase' }}>Contato e redes sociais</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LBL}>Instagram</label>
                <input style={INP} className="pf-inp" value={form.instagram} onChange={set('instagram')} placeholder="@empresa.exemplo" />
              </div>
              <div>
                <label style={LBL}>WhatsApp</label>
                <input style={INP} className="pf-inp" value={form.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={LBL}>E-mail de contato</label>
                <input style={{ ...INP }} className="pf-inp" type="email" value={form.email} onChange={set('email')} placeholder="contato@empresa.com.br" />
              </div>
              <div>
                <label style={LBL}>Website</label>
                <input style={INP} className="pf-inp" type="url" value={form.website} onChange={set('website')} placeholder="https://empresa.com.br" />
              </div>
            </div>
          </div>

          {/* Save */}
          <button
            type="submit"
            disabled={saving || !form.name}
            style={{
              background: saving ? 'rgba(0,122,255,0.5)' : '#007AFF',
              color: '#fff', border: 'none', borderRadius: 12,
              padding: '14px', fontSize: 14, fontWeight: 700,
              cursor: saving || !form.name ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'opacity 0.15s', opacity: !form.name ? 0.5 : 1,
            }}
            onMouseEnter={e => { if (!saving && form.name) e.currentTarget.style.opacity = '0.88' }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
          >
            {saving
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : <><Save size={16} /> Salvar Alterações</>}
          </button>
        </form>

        {/* ── Preview card ── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 11, color: '#8e8e93', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Pré-visualização
          </div>
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
            {/* Cover */}
            <div style={{ position: 'relative', height: 130 }}>
              {form.cover_url
                ? <img src={form.cover_url} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #e8e8f0, #d0d0dc)' }} />}
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 60%)' }} />

              {/* Logo over cover */}
              <div style={{ position: 'absolute', bottom: -24, left: 14, width: 48, height: 48, borderRadius: '50%', border: '3px solid #fff', background: form.image_url ? 'transparent' : '#e5e5ea', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                {form.image_url
                  ? <img src={form.image_url} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Camera size={16} color="#8e8e93" />
                    </div>}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '30px 16px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                <div style={{ background: `${segColor}15`, border: `1px solid ${segColor}44`, color: segColor, fontSize: 9.5, fontWeight: 700, padding: '2px 8px', borderRadius: 20 }}>
                  {form.segment}
                </div>
                {form.city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#8e8e93', fontSize: 10 }}>
                    <MapPin size={9} /> {form.city}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#1a1a1a', marginBottom: 8 }}>
                {form.name || 'Nome da empresa'}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                {[1,2,3,4,5].map(s => <Star key={s} size={11} fill="#f97316" color="#f97316" />)}
                <span style={{ fontSize: 11, color: '#8e8e93', marginLeft: 2 }}>sem avaliações</span>
              </div>

              <p style={{ fontSize: 12, color: '#6b6b6b', lineHeight: 1.6, margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {form.bio || 'Sua bio aparecerá aqui...'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
                {form.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6b6b' }}>
                    <Globe size={11} color="#8e8e93" /> {form.instagram}
                  </div>
                )}
                {form.whatsapp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b6b6b' }}>
                    <Phone size={11} color="#8e8e93" /> {form.whatsapp}
                  </div>
                )}
              </div>

              <div style={{ background: '#007AFF', color: '#fff', borderRadius: 10, padding: '9px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}>
                Solicitar Orçamento
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Meu Plano ── */}
      {!planInfo.loading && planInfo.status && (
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCard size={16} color="#007AFF" />
              </div>
              <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', fontWeight: 700 }}>MEU PLANO</p>
            </div>
            <Link href="/fornecedor/planos" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
              Gerenciar plano <ArrowRight size={12} />
            </Link>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            <div style={{ background: '#f2f2f7', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 4 }}>Plano atual</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{planInfo.planNome ?? '—'}</div>
            </div>
            <div style={{ background: '#f2f2f7', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 4 }}>Status</div>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                fontSize: 12.5, fontWeight: 700,
                color: planInfo.status === 'trial' ? '#f97316' : planInfo.status === 'ativa' ? '#059669' : planInfo.status === 'fundador' ? '#7c3aed' : '#ef4444',
              }}>
                {planInfo.status === 'trial' ? `Trial · ${planInfo.trialDaysLeft}d restantes`
                  : planInfo.status === 'ativa' ? 'Ativo'
                  : planInfo.status === 'fundador' ? 'Fundador'
                  : planInfo.status === 'inadimplente' ? 'Inadimplente'
                  : 'Cancelado'}
              </div>
            </div>
            {planInfo.proximaCobranca && (
              <div style={{ background: '#f2f2f7', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 4 }}>Próxima cobrança</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                  {planInfo.proximaCobranca.toLocaleDateString('pt-BR')}
                </div>
              </div>
            )}
            {planInfo.valorMensal && (
              <div style={{ background: '#f2f2f7', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: 10.5, color: '#8e8e93', marginBottom: 4 }}>Valor</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                  {planInfo.valorMensal.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 })}/mês
                </div>
              </div>
            )}
          </div>
          {(planInfo.status === 'trial' || planInfo.status === 'inadimplente') && (
            <Link href="/fornecedor/planos" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              marginTop: 16, padding: '11px', borderRadius: 10,
              background: '#007AFF', color: '#fff', textDecoration: 'none',
              fontSize: 13, fontWeight: 700,
            }}>
              <Zap size={13} /> Fazer upgrade do plano
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
