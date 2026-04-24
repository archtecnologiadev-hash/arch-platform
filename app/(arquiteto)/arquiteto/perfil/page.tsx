'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import ImageCropModal, { type CropConfig } from '@/components/shared/ImageCropModal'
import {
  Save, ExternalLink, Loader2, Camera, Plus, X, ImagePlus, CheckCircle2, CreditCard, ArrowRight, Zap,
} from 'lucide-react'
import { usePlan } from '@/hooks/usePlan'

function slugify(t: string) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim()
}

const ESTADOS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO']
const ESPECIALIDADES = ['Residencial','Comercial','Interiores','Corporativo','Institucional','Paisagismo']
const CATEGORIAS = ['Residencial','Comercial','Interiores','Corporativo','Institucional','Paisagismo','Outro']

interface ImgPreview { url: string; file?: File }
interface ProjPortfolio {
  id?: string
  nome: string
  descricao: string
  categoria: string
  imagens: ImgPreview[]
}

const LBL: React.CSSProperties = {
  display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em',
}
const INP: React.CSSProperties = {
  width: '100%', padding: '10px 14px', background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', fontSize: 13.5,
  outline: 'none', boxSizing: 'border-box', borderRadius: 10,
}

function Field({ label, value, onChange, placeholder, required, type }: {
  label: string; value: string; onChange: (v: string) => void
  placeholder?: string; required?: boolean; type?: string
}) {
  return (
    <div>
      <label style={LBL}>{label}{required && <span style={{ color: '#ef4444' }}> *</span>}</label>
      <input
        type={type ?? 'text'} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required} style={INP}
        onFocus={e => (e.target.style.borderColor = '#007AFF')}
        onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
      />
    </div>
  )
}

export default function ArquitetoPerfilPage() {
  const planInfo = usePlan()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null)
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  // form fields
  const [nome, setNome] = useState('')
  const [nomeResp, setNomeResp] = useState('')
  const [cidade, setCidade] = useState('')
  const [estado, setEstado] = useState('')
  const [telefone, setTelefone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [website, setWebsite] = useState('')
  const [bio, setBio] = useState('')
  const [espec, setEspec] = useState<string[]>([])

  // images
  const [fotoPerfil, setFotoPerfil] = useState('')
  const [perfilFile, setPerfilFile] = useState<File | null>(null)
  const [origImageUrl, setOrigImageUrl] = useState('')
  const [fotoCapa, setFotoCapa] = useState('')
  const [capaFile, setCapaFile] = useState<File | null>(null)
  const [origCoverUrl, setOrigCoverUrl] = useState('')

  // portfolio
  const [projetos, setProjetos] = useState<ProjPortfolio[]>([])
  const [showModal, setShowModal] = useState(false)
  const [novoProj, setNovoProj] = useState<ProjPortfolio>({ nome: '', descricao: '', categoria: '', imagens: [] })
  const [savingProj, setSavingProj] = useState(false)

  const [cropConfig, setCropConfig] = useState<CropConfig | null>(null)

  const perfilRef = useRef<HTMLInputElement>(null)
  const capaRef = useRef<HTMLInputElement>(null)
  const projImgRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('escritorios').select('*').eq('user_id', user.id).maybeSingle()

      if (data) {
        setEscritorioId(data.id)
        setNome(data.nome ?? '')
        setNomeResp(data.nome_responsavel ?? '')
        setCidade(data.cidade ?? '')
        setEstado(data.estado ?? '')
        setTelefone(data.telefone ?? '')
        setInstagram(data.instagram ?? '')
        setWebsite(data.website ?? '')
        setBio(data.bio ?? '')
        setEspec(data.especialidades ?? [])
        setFotoPerfil(data.image_url ?? '')
        setOrigImageUrl(data.image_url ?? '')
        setFotoCapa(data.cover_url ?? '')
        setOrigCoverUrl(data.cover_url ?? '')

        const { data: projs } = await supabase
          .from('projetos_portfolio')
          .select('*, portfolio_imagens(*)')
          .eq('escritorio_id', data.id)
          .order('created_at', { ascending: false })

        if (projs) {
          setProjetos(projs.map((p: Record<string, unknown>) => {
            const imgs = ((p.portfolio_imagens as Record<string, unknown>[] | null) ?? [])
              .sort((a, b) => (a.ordem as number) - (b.ordem as number))
            return {
              id: p.id as string,
              nome: (p.nome as string) ?? '',
              descricao: (p.descricao as string) ?? '',
              categoria: (p.categoria as string) ?? '',
              imagens: imgs.map(img => ({ url: img.url as string })),
            }
          }))
        }
      }
      setLoading(false)
    }
    load()
  }, [])

  function showToast(msg: string, ok = true) {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3500)
  }

  function maskPhone(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 11)
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0,2)}) ${d.slice(2)}`
    return `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`
  }

  function toggleEspec(e: string) {
    setEspec(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }

  async function uploadImg(file: File, path: string): Promise<string | null> {
    const supabase = createClient()
    console.log('[perfil] upload start:', path, 'size:', file.size, 'type:', file.type)

    let { error } = await supabase.storage.from('escritorios').upload(path, file, { upsert: true })

    // If bucket doesn't exist yet, create it and retry once
    if (error && (error.message.includes('not found') || error.message.includes('Bucket not found') || error.statusCode === '404' || (error as { statusCode?: string | number }).statusCode === 404)) {
      console.warn('[perfil] bucket not found — attempting createBucket')
      const { error: bucketErr } = await supabase.storage.createBucket('escritorios', { public: true })
      if (bucketErr && !bucketErr.message.includes('already exists')) {
        console.error('[perfil] createBucket error:', bucketErr)
        return null
      }
      const retry = await supabase.storage.from('escritorios').upload(path, file, { upsert: true })
      error = retry.error
    }

    if (error) {
      console.error('[perfil] upload FAILED:', JSON.stringify({ message: error.message, statusCode: (error as { statusCode?: unknown }).statusCode, name: error.name, cause: (error as { cause?: unknown }).cause }, null, 2))
      return null
    }

    const { data: { publicUrl } } = supabase.storage.from('escritorios').getPublicUrl(path)
    console.log('[perfil] upload OK → publicUrl:', publicUrl)
    return publicUrl
  }

  async function handleSave() {
    console.log('[perfil] handleSave called — userId:', userId, 'nome:', nome.trim())
    if (!nome.trim() || !userId) {
      console.warn('[perfil] save aborted: nome vazio ou userId null')
      return
    }
    setSaving(true)
    const supabase = createClient()
    const slug = slugify(nome)

    // Strip any cache-bust params; use origUrl as fallback for blobs not yet uploaded
    let imageUrl = fotoPerfil.startsWith('blob:') ? origImageUrl : fotoPerfil.split('?')[0]
    let coverUrl = fotoCapa.startsWith('blob:') ? origCoverUrl : fotoCapa.split('?')[0]

    if (perfilFile) {
      const ext = perfilFile.name.split('.').pop() ?? 'jpg'
      const uploadPath = `${userId}/photo.${ext}`
      console.log('[perfil] uploading profile photo →', uploadPath)
      const url = await uploadImg(perfilFile, uploadPath)
      console.log('[perfil] profile photo result:', url)
      if (url) {
        imageUrl = url
        setOrigImageUrl(url)
        setFotoPerfil(`${url}?t=${Date.now()}`)  // cache-bust for display only
        setPerfilFile(null)
      }
    }
    if (capaFile) {
      const ext = capaFile.name.split('.').pop() ?? 'jpg'
      const uploadPath = `${userId}/cover.${ext}`
      console.log('[perfil] uploading cover →', uploadPath)
      const url = await uploadImg(capaFile, uploadPath)
      console.log('[perfil] cover result:', url)
      if (url) {
        coverUrl = url
        setOrigCoverUrl(url)
        setFotoCapa(`${url}?t=${Date.now()}`)  // cache-bust for display only
        setCapaFile(null)
      }
    }

    const payload = {
      user_id:          userId,
      nome:             nome.trim(),
      nome_responsavel: nomeResp.trim() || null,
      cidade:           cidade.trim() || null,
      estado:           estado || null,
      telefone:         telefone || null,
      instagram:        instagram || null,
      website:          website || null,
      bio:              bio || null,
      especialidades:   espec,
      image_url:        imageUrl || null,
      cover_url:        coverUrl || null,
      slug,
    }

    console.log('[perfil] upserting payload:', payload)

    const { data, error } = await supabase
      .from('escritorios')
      .upsert(payload, { onConflict: 'user_id' })
      .select('id, image_url, cover_url')
      .single()

    console.log('[perfil] upsert result — data:', data, 'error:', error)

    if (error) {
      console.error('[perfil] upsert error code:', error.code, 'message:', error.message, 'details:', error.details, 'hint:', error.hint)
      showToast(error.message ?? 'Erro ao salvar. Tente novamente.', false)
    } else if (data) {
      console.log('[perfil] saved successfully, id:', data.id)
      if (!escritorioId) setEscritorioId(data.id)
      // Sync display state with what was actually saved in DB
      if (data.image_url && !perfilFile) {
        setFotoPerfil(`${data.image_url}?t=${Date.now()}`)
        setOrigImageUrl(data.image_url)
      }
      if (data.cover_url && !capaFile) {
        setFotoCapa(`${data.cover_url}?t=${Date.now()}`)
        setOrigCoverUrl(data.cover_url)
      }
      showToast('Perfil atualizado!')
    }
    setSaving(false)
  }

  async function handleSaveProj() {
    if (!novoProj.nome.trim() || !userId) return
    if (!escritorioId) {
      showToast('Salve o perfil primeiro antes de adicionar projetos.', false)
      return
    }
    setSavingProj(true)
    const supabase = createClient()

    const { data: proj, error: projErr } = await supabase
      .from('projetos_portfolio')
      .insert({ escritorio_id: escritorioId, nome: novoProj.nome, descricao: novoProj.descricao, categoria: novoProj.categoria })
      .select('id').single()

    if (!projErr && proj) {
      const savedImgs: ImgPreview[] = []
      for (let i = 0; i < novoProj.imagens.length; i++) {
        const img = novoProj.imagens[i]
        if (img.file) {
          const ext = img.file.name.split('.').pop() ?? 'jpg'
          const url = await uploadImg(img.file, `${userId}/portfolio/${proj.id}/${i}.${ext}`)
          if (url) {
            await supabase.from('portfolio_imagens').insert({ projeto_portfolio_id: proj.id, url, ordem: i })
            savedImgs.push({ url })
          }
        }
      }
      setProjetos(prev => [{ id: proj.id, nome: novoProj.nome, descricao: novoProj.descricao, categoria: novoProj.categoria, imagens: savedImgs }, ...prev])
      setShowModal(false)
      setNovoProj({ nome: '', descricao: '', categoria: '', imagens: [] })
      showToast('Projeto adicionado ao portfólio!')
    } else {
      console.error('[perfil] portfolio save error:', projErr)
      showToast(projErr?.message ?? 'Erro ao salvar projeto.', false)
    }
    setSavingProj(false)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  const slug = slugify(nome)
  const publicUrl = nome.trim() ? `/escritorio/${slug}` : null

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes slideDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:translateY(0)}}
        .hover-overlay:hover{opacity:1!important}
        .chip-btn:hover{filter:brightness(0.95)}
      `}</style>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)',
          background: '#1a1a1a', color: '#fff', padding: '12px 20px', borderRadius: 12,
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

      {/* ── Top bar ─────────────────────────────────────────────────── */}
      <div style={{
        background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.08)',
        padding: '0 24px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 40,
      }}>
        <span style={{ fontSize: 15, fontWeight: 600 }}>Meu Perfil</span>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          {publicUrl && (
            <a href={publicUrl} target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              color: '#007AFF', textDecoration: 'none', padding: '7px 13px',
              borderRadius: 8, border: '1px solid rgba(0,122,255,0.25)',
              background: 'rgba(0,122,255,0.06)',
            }}>
              <ExternalLink size={12} /> Ver perfil público
            </a>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !nome.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: saving ? 'rgba(0,122,255,0.5)' : '#007AFF',
              color: '#fff', border: 'none', borderRadius: 10,
              padding: '9px 18px', fontSize: 13, fontWeight: 600,
              cursor: saving || !nome.trim() ? 'not-allowed' : 'pointer',
              opacity: !nome.trim() ? 0.5 : 1, transition: 'all 0.15s',
            }}>
            {saving
              ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : <><Save size={14} /> Salvar</>}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 700, margin: '0 auto', padding: '28px 20px 48px' }}>

        {/* ── Cover + Avatar ─────────────────────────────────────────── */}
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16,
          overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 18,
        }}>
          {/* Cover */}
          <input ref={capaRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => {
              const f = e.target.files?.[0]
              if (f) {
                const src = URL.createObjectURL(f)
                setCropConfig({ src, aspect: 16 / 5, circular: false, onConfirm: blob => {
                  const cropped = new File([blob], f.name, { type: 'image/jpeg' })
                  setCapaFile(cropped)
                  setFotoCapa(URL.createObjectURL(blob))
                  setCropConfig(null)
                }, onCancel: () => setCropConfig(null) })
              }
              e.target.value = ''
            }} />
          <div
            onClick={() => capaRef.current?.click()}
            style={{
              height: 160, cursor: 'pointer', position: 'relative', overflow: 'hidden',
              background: fotoCapa ? 'transparent' : 'linear-gradient(135deg, #e8e8f0, #d0d0dc)',
            }}>
            {fotoCapa
              ? <img src={fotoCapa} alt="Capa" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <ImagePlus size={24} color="#8e8e93" />
                  <span style={{ fontSize: 12, color: '#8e8e93' }}>Clique para adicionar foto de capa</span>
                </div>}
            {/* hover hint */}
            <div style={{
              position: 'absolute', bottom: 10, right: 10,
              background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
              borderRadius: 8, padding: '5px 11px',
              display: 'flex', alignItems: 'center', gap: 5,
            }}>
              <Camera size={11} color="#fff" />
              <span style={{ fontSize: 11, color: '#fff' }}>Trocar capa</span>
            </div>
          </div>

          {/* Avatar row */}
          <div style={{ padding: '0 20px 20px', display: 'flex', alignItems: 'flex-end', gap: 14, marginTop: -36 }}>
            <input ref={perfilRef} type="file" accept="image/*" style={{ display: 'none' }}
              onChange={e => {
                const f = e.target.files?.[0]
                if (f) {
                  const src = URL.createObjectURL(f)
                  setCropConfig({ src, aspect: 1, circular: true, onConfirm: blob => {
                    const cropped = new File([blob], f.name, { type: 'image/jpeg' })
                    setPerfilFile(cropped)
                    setFotoPerfil(URL.createObjectURL(blob))
                    setCropConfig(null)
                  }, onCancel: () => setCropConfig(null) })
                }
                e.target.value = ''
              }} />
            <div
              onClick={() => perfilRef.current?.click()}
              title="Trocar foto de perfil"
              style={{
                width: 76, height: 76, borderRadius: '50%', border: '3px solid #fff',
                background: fotoPerfil ? 'transparent' : '#e5e5ea',
                overflow: 'hidden', cursor: 'pointer', flexShrink: 0,
                position: 'relative', boxShadow: '0 2px 10px rgba(0,0,0,0.18)',
              }}>
              {fotoPerfil
                ? <img src={fotoPerfil} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Camera size={20} color="#8e8e93" />
                  </div>}
              <div style={{
                position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, transition: 'opacity 0.18s', borderRadius: '50%',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
                <Camera size={15} color="#fff" />
              </div>
            </div>
            <div style={{ paddingBottom: 4 }}>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
                {nome || <span style={{ color: '#c7c7cc' }}>Nome do escritório</span>}
              </div>
              {(cidade || estado) &&
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>
                  {[cidade, estado].filter(Boolean).join(', ')}
                </div>}
            </div>
          </div>
        </div>

        {/* ── Informações básicas ─────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', marginBottom: 20, fontWeight: 700 }}>INFORMAÇÕES BÁSICAS</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Field label="Nome do escritório" value={nome} onChange={setNome} placeholder="Ex: Estúdio Brasilis" required />
            <Field label="Nome do arquiteto responsável" value={nomeResp} onChange={setNomeResp} placeholder="Ex: Ricardo Almeida" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px', gap: 12 }}>
              <Field label="Cidade" value={cidade} onChange={setCidade} placeholder="São Paulo" />
              <div>
                <label style={LBL}>Estado</label>
                <select value={estado} onChange={e => setEstado(e.target.value)} style={{ ...INP, cursor: 'pointer' }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}>
                  <option value="">—</option>
                  {ESTADOS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                </select>
              </div>
            </div>
            <Field label="Telefone / WhatsApp" value={telefone} onChange={v => setTelefone(maskPhone(v))} placeholder="(11) 99999-9999" />
            <Field label="Instagram" value={instagram} onChange={setInstagram} placeholder="@seu.escritorio" />
            <Field label="Website" value={website} onChange={setWebsite} placeholder="https://seusite.com.br" type="url" />
            <div>
              <label style={LBL}>Bio / Descrição &nbsp;
                <span style={{ color: bio.length > 460 ? '#ff9500' : '#c7c7cc' }}>{bio.length}/500</span>
              </label>
              <textarea
                value={bio} onChange={e => setBio(e.target.value.slice(0, 500))}
                placeholder="Descreva seu escritório, filosofia de trabalho, diferenciais..."
                rows={4}
                style={{ ...INP, resize: 'none', lineHeight: 1.65 }}
                onFocus={e => (e.target.style.borderColor = '#007AFF')}
                onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
              />
            </div>
          </div>
        </div>

        {/* ── Especialidades ─────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginBottom: 14 }}>
          <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', marginBottom: 18, fontWeight: 700 }}>ESPECIALIDADES</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ESPECIALIDADES.map(e => (
              <button key={e} type="button" className="chip-btn" onClick={() => toggleEspec(e)} style={{
                padding: '8px 18px', borderRadius: 20, fontSize: 13, cursor: 'pointer',
                transition: 'all 0.15s',
                background: espec.includes(e) ? '#007AFF' : '#f2f2f7',
                color: espec.includes(e) ? '#fff' : '#3a3a3a',
                border: espec.includes(e) ? '1.5px solid #007AFF' : '1.5px solid transparent',
                fontWeight: espec.includes(e) ? 600 : 400,
              }}>{e}</button>
            ))}
          </div>
        </div>

        {/* ── Portfólio ──────────────────────────────────────────────── */}
        <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', fontWeight: 700 }}>PORTFÓLIO</p>
            <button type="button" onClick={() => { setNovoProj({ nome: '', descricao: '', categoria: '', imagens: [] }); setShowModal(true) }} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: '#007AFF',
              color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px',
              fontSize: 12, fontWeight: 600, cursor: 'pointer',
            }}>
              <Plus size={13} /> Adicionar projeto
            </button>
          </div>

          {projetos.length === 0
            ? <div style={{ textAlign: 'center', padding: '32px 0', color: '#8e8e93', fontSize: 13 }}>
                Nenhum projeto ainda. Adicione seu primeiro projeto!
              </div>
            : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
                {projetos.map((p, i) => (
                  <div key={p.id ?? i} style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', background: '#f2f2f7' }}>
                    <div style={{ height: 110, overflow: 'hidden', background: '#e5e5ea' }}>
                      {p.imagens[0]
                        ? <img src={p.imagens[0].url} alt={p.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ImagePlus size={18} color="#c7c7cc" />
                          </div>}
                    </div>
                    <div style={{ padding: '8px 10px' }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</div>
                      {p.categoria && <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{p.categoria}</div>}
                    </div>
                  </div>
                ))}
              </div>}
        </div>

        {/* ── Meu Plano ──────────────────────────────────────────────── */}
        {!planInfo.loading && planInfo.status && (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', marginTop: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(0,122,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} color="#007AFF" />
                </div>
                <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', fontWeight: 700 }}>MEU PLANO</p>
              </div>
              <Link href="/arquiteto/planos" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12.5, color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>
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
              <Link href="/arquiteto/planos" style={{
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

      {/* ── Crop Modal ─────────────────────────────────────────────── */}
      {cropConfig && <ImageCropModal {...cropConfig} />}

      {/* ── Modal: Novo Projeto ─────────────────────────────────────── */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: 16,
        }}
          onClick={e => { if (e.target === e.currentTarget) setShowModal(false) }}>
          <div style={{
            background: '#fff', borderRadius: 18, width: '100%', maxWidth: 500,
            maxHeight: '90vh', overflow: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,0.35)',
            animation: 'slideDown 0.2s ease',
          }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 15, fontWeight: 600 }}>Novo Projeto</span>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}>
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Field label="Nome do projeto *" value={novoProj.nome} onChange={v => setNovoProj(p => ({ ...p, nome: v }))} placeholder="Ex: Residência Vale Verde" />
              <div>
                <label style={LBL}>Categoria</label>
                <select value={novoProj.categoria} onChange={e => setNovoProj(p => ({ ...p, categoria: e.target.value }))} style={{ ...INP, cursor: 'pointer' }}>
                  <option value="">Selecione</option>
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={LBL}>Descrição curta</label>
                <textarea value={novoProj.descricao} onChange={e => setNovoProj(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Breve descrição do projeto..." rows={3}
                  style={{ ...INP, resize: 'none', lineHeight: 1.6 }} />
              </div>
              <div>
                <label style={LBL}>Fotos <span style={{ color: '#c7c7cc' }}>(até 5)</span></label>
                <input ref={projImgRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f && novoProj.imagens.length < 5) {
                      const src = URL.createObjectURL(f)
                      setCropConfig({ src, aspect: 4 / 3, circular: false, onConfirm: blob => {
                        const cropped = new File([blob], f.name, { type: 'image/jpeg' })
                        setNovoProj(p => ({ ...p, imagens: [...p.imagens, { url: URL.createObjectURL(blob), file: cropped }] }))
                        setCropConfig(null)
                      }, onCancel: () => setCropConfig(null) })
                    }
                    e.target.value = ''
                  }} />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {novoProj.imagens.map((img, i) => (
                    <div key={i} style={{ position: 'relative', width: 72, height: 72, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)' }}>
                      <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button type="button" onClick={() => setNovoProj(p => ({ ...p, imagens: p.imagens.filter((_, j) => j !== i) }))}
                        style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <X size={10} color="#fff" />
                      </button>
                    </div>
                  ))}
                  {novoProj.imagens.length < 5 && (
                    <button type="button" onClick={() => projImgRef.current?.click()} style={{
                      width: 72, height: 72, borderRadius: 8, border: '1.5px dashed rgba(0,0,0,0.15)',
                      background: '#f2f2f7', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      <Plus size={16} color="#8e8e93" />
                      <span style={{ fontSize: 10, color: '#8e8e93' }}>Foto</span>
                    </button>
                  )}
                </div>
              </div>
              <button type="button" onClick={handleSaveProj}
                disabled={savingProj || !novoProj.nome.trim()}
                style={{
                  background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10,
                  padding: '13px', fontSize: 13, fontWeight: 600,
                  cursor: savingProj || !novoProj.nome.trim() ? 'not-allowed' : 'pointer',
                  opacity: !novoProj.nome.trim() ? 0.5 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                {savingProj
                  ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
                  : 'Salvar Projeto'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
