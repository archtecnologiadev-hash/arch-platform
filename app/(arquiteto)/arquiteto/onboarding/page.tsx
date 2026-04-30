'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Check, Loader2, Upload, Plus, X, ArrowRight, Sparkles } from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

type StepId = 'perfil' | 'projeto' | 'equipe' | 'pagamento'

interface StepDef { id: StepId; label: string; num: number }

const STEPS: StepDef[] = [
  { id: 'perfil',    label: 'Perfil',   num: 1 },
  { id: 'projeto',   label: 'Projeto',  num: 2 },
  { id: 'equipe',    label: 'Equipe',   num: 3 },
  { id: 'pagamento', label: 'Plano',    num: 4 },
]

const inp: React.CSSProperties = {
  width: '100%', padding: '12px 14px', background: 'var(--bg)',
  border: '1px solid var(--border-input)', borderRadius: 10,
  color: 'var(--text)', fontSize: 14, outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s',
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ current, completed }: { current: StepId; completed: StepId[] }) {
  const currentIdx = STEPS.findIndex(s => s.id === current)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {STEPS.map((s, i) => {
        const done = completed.includes(s.id)
        const active = s.id === current
        return (
          <div key={s.id} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                transition: 'all 0.3s',
                background: done ? '#22c55e' : active ? '#007AFF' : '#f2f2f7',
                color: done || active ? '#fff' : '#8e8e93',
                border: done ? 'none' : active ? 'none' : '2px solid rgba(0,0,0,0.1)',
                boxShadow: active ? '0 0 0 4px rgba(0,122,255,0.15)' : 'none',
              }}>
                {done ? <Check size={15} strokeWidth={3} /> : s.num}
              </div>
              <span style={{ fontSize: 11, color: active ? '#007AFF' : done ? '#22c55e' : '#8e8e93', fontWeight: active ? 600 : 400, whiteSpace: 'nowrap' }}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 4px', marginBottom: 22,
                background: completed.includes(STEPS[i + 1]?.id) || currentIdx > i ? '#22c55e' : currentIdx === i ? 'linear-gradient(to right, #007AFF 50%, rgba(0,0,0,0.1) 50%)' : 'rgba(0,0,0,0.1)',
                transition: 'all 0.3s',
              }} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1: Perfil ───────────────────────────────────────────────────────────

function Step1({ userId, onNext }: { userId: string; onNext: () => void }) {
  const [nomeEscritorio, setNomeEscritorio] = useState('')
  const [cidade, setCidade] = useState('')
  const [bio, setBio] = useState('')
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    const reader = new FileReader()
    reader.onload = ev => setAvatarPreview(ev.target?.result as string)
    reader.readAsDataURL(file)
  }

  async function save() {
    if (!nomeEscritorio.trim()) { setError('Informe o nome do escritório'); return }
    setSaving(true); setError(null)
    const supabase = createClient()

    let avatarUrl: string | null = null
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop() ?? 'jpg'
      const path = `${userId}/avatar_${Date.now()}.${ext}`
      const { error: upErr } = await supabase.storage.from('avatars').upload(path, avatarFile, { upsert: true })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)
        avatarUrl = publicUrl
      }
    }

    // Upsert escritório
    const { data: existing } = await supabase.from('escritorios').select('id').eq('user_id', userId).maybeSingle()
    if (existing?.id) {
      await supabase.from('escritorios').update({
        nome: nomeEscritorio.trim(),
        cidade: cidade.trim() || null,
        bio: bio.trim() || null,
        ...(avatarUrl ? { image_url: avatarUrl } : {}),
      }).eq('id', existing.id)
    } else {
      await supabase.from('escritorios').insert({
        user_id: userId,
        nome: nomeEscritorio.trim(),
        cidade: cidade.trim() || null,
        bio: bio.trim() || null,
        slug: nomeEscritorio.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Date.now(),
        ...(avatarUrl ? { image_url: avatarUrl } : {}),
      })
    }

    if (avatarUrl) {
      await supabase.from('users').update({ avatar_url: avatarUrl }).eq('id', userId)
    }

    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    if (!passos.includes('perfil')) {
      await supabase.from('users').update({ onboarding_passos_completos: [...passos, 'perfil'] }).eq('id', userId)
    }

    setSaving(false)
    onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Complete seu perfil</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 300 }}>Essas informações aparecem no seu escritório na plataforma.</p>
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            width: 72, height: 72, borderRadius: '50%', cursor: 'pointer',
            background: avatarPreview ? 'transparent' : 'rgba(0,122,255,0.08)',
            border: '2px dashed rgba(0,122,255,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0, transition: 'border-color 0.15s',
          }}
        >
          {avatarPreview
            ? <img src={avatarPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Upload size={20} color="var(--accent)" />}
        </div>
        <div>
          <button onClick={() => fileRef.current?.click()} style={{ background: 'none', border: '1px solid rgba(0,122,255,0.25)', borderRadius: 8, padding: '7px 14px', color: 'var(--accent)', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {avatarPreview ? 'Trocar foto' : 'Adicionar foto'}
          </button>
          <p style={{ fontSize: 11.5, color: 'var(--text-3)', marginTop: 4 }}>Opcional · JPG ou PNG</p>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
      </div>

      {/* Nome do escritório */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Nome do escritório *</label>
        <input
          style={inp} value={nomeEscritorio} onChange={e => setNomeEscritorio(e.target.value)}
          placeholder="Ex: Silva Arquitetura"
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        />
      </div>

      {/* Cidade */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Cidade</label>
        <input
          style={inp} value={cidade} onChange={e => setCidade(e.target.value)}
          placeholder="Ex: São Paulo, SP"
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        />
      </div>

      {/* Bio */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Descrição do escritório <span style={{ color: 'var(--logout-btn)' }}>(opcional)</span></label>
        <textarea
          style={{ ...inp, resize: 'none' as const, lineHeight: 1.6 }}
          value={bio} onChange={e => setBio(e.target.value)}
          rows={3} placeholder="Foco em projetos residenciais de alto padrão..."
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        />
      </div>

      {error && <p style={{ fontSize: 13, color: '#ff3b30', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.15)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>{error}</p>}

      <button
        onClick={save} disabled={saving || !nomeEscritorio.trim()}
        style={{ width: '100%', padding: '14px', background: saving || !nomeEscritorio.trim() ? '#a0c4ff' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving || !nomeEscritorio.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
      >
        {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <>Próximo <ArrowRight size={16} /></>}
      </button>
    </div>
  )
}

// ─── Step 2: Projeto ──────────────────────────────────────────────────────────

function Step2({ userId, onNext, onSkip }: { userId: string; onNext: () => void; onSkip: () => void }) {
  const [nome, setNome] = useState('')
  const [tipo, setTipo] = useState('residencial')
  const [emailCliente, setEmailCliente] = useState('')
  const [saving, setSaving] = useState(false)

  async function save() {
    if (!nome.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data: esc } = await supabase.from('escritorios').select('id').eq('user_id', userId).maybeSingle()
    if (esc?.id) {
      const { data: proj } = await supabase.from('projetos').insert({
        escritorio_id: esc.id, nome: nome.trim(), tipo, email_cliente: emailCliente.trim() || null,
      }).select('id').single()

      if (proj?.id) {
        const pastas = ['Fotos de Obra', 'Croquis e Esboços', 'Plantas e Projetos', 'Documentos', 'Referências']
        await supabase.from('projeto_pastas').insert(
          pastas.map((n, ordem) => ({ projeto_id: proj.id, nome: n, pasta_pai_id: null, criado_por: userId, ordem }))
        )
      }
    }
    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    if (!passos.includes('projeto')) {
      await supabase.from('users').update({ onboarding_passos_completos: [...passos, 'projeto'] }).eq('id', userId)
    }
    setSaving(false); onNext()
  }

  async function skip() {
    const supabase = createClient()
    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    if (!passos.includes('projeto')) {
      await supabase.from('users').update({ onboarding_passos_completos: [...passos, 'projeto'] }).eq('id', userId)
    }
    onSkip()
  }

  const TIPOS = [
    { value: 'residencial', label: 'Residencial' },
    { value: 'comercial',   label: 'Comercial'   },
    { value: 'institucional', label: 'Institucional' },
  ]

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Crie seu primeiro projeto</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 300 }}>Você pode criar mais projetos a qualquer momento no painel.</p>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Nome do projeto *</label>
        <input
          style={inp} value={nome} onChange={e => setNome(e.target.value)}
          placeholder="Ex: Residência Família Souza"
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 8 }}>Tipo de projeto</label>
        <div style={{ display: 'flex', gap: 8 }}>
          {TIPOS.map(t => (
            <button key={t.value} onClick={() => setTipo(t.value)} type="button"
              style={{ flex: 1, padding: '10px 8px', borderRadius: 9, border: `1px solid ${tipo === t.value ? '#007AFF' : 'rgba(0,0,0,0.1)'}`, background: tipo === t.value ? 'rgba(0,122,255,0.06)' : '#f2f2f7', color: tipo === t.value ? '#007AFF' : '#1a1a1a', fontSize: 12.5, fontWeight: tipo === t.value ? 600 : 400, cursor: 'pointer', transition: 'all 0.15s' }}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Email do cliente <span style={{ color: 'var(--logout-btn)' }}>(opcional)</span></label>
        <input
          style={inp} type="email" value={emailCliente} onChange={e => setEmailCliente(e.target.value)}
          placeholder="cliente@email.com"
          onFocus={e => (e.target.style.borderColor = '#007AFF')}
          onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
        />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={save} disabled={saving || !nome.trim()}
          style={{ width: '100%', padding: '14px', background: saving || !nome.trim() ? '#a0c4ff' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving || !nome.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Criando...</> : <>Criar projeto e continuar <ArrowRight size={16} /></>}
        </button>
        <button onClick={skip} style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border-input)', borderRadius: 10, fontSize: 14, color: 'var(--text-3)', cursor: 'pointer' }}>
          Pular este passo
        </button>
      </div>
    </div>
  )
}

// ─── Step 3: Equipe ───────────────────────────────────────────────────────────

function Step3({ userId, onNext, onSkip }: { userId: string; onNext: () => void; onSkip: () => void }) {
  const [convidados, setConvidados] = useState<Array<{ email: string; nome: string }>>([])
  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [saving, setSaving] = useState(false)
  const [added, setAdded] = useState(false)

  function addToList() {
    if (!email.trim() || !nome.trim()) return
    setConvidados(prev => [...prev, { email: email.trim(), nome: nome.trim() }])
    setEmail(''); setNome(''); setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  async function saveAndNext() {
    setSaving(true)
    const supabase = createClient()
    const { data: esc } = await supabase.from('escritorios').select('id').eq('user_id', userId).maybeSingle()

    if (esc?.id && convidados.length > 0) {
      for (const c of convidados) {
        const token = Math.random().toString(36).slice(2) + Date.now().toString(36)
        await supabase.from('convites_equipe').insert({
          escritorio_id: esc.id,
          email: c.email.toLowerCase(),
          nome: c.nome,
          nivel_permissao: 'operacional',
          token,
        })
      }
    }

    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    if (!passos.includes('equipe')) {
      await supabase.from('users').update({ onboarding_passos_completos: [...passos, 'equipe'] }).eq('id', userId)
    }
    setSaving(false); onNext()
  }

  async function skip() {
    const supabase = createClient()
    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    if (!passos.includes('equipe')) {
      await supabase.from('users').update({ onboarding_passos_completos: [...passos, 'equipe'] }).eq('id', userId)
    }
    onSkip()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Convide sua equipe</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 300 }}>Trabalha sozinho? Pode pular este passo — você convida depois em Equipe.</p>
      </div>

      {/* Add member form */}
      <div style={{ background: '#f9f9f9', borderRadius: 12, padding: '16px', border: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <input
            style={inp} value={nome} onChange={e => setNome(e.target.value)}
            placeholder="Nome do colaborador"
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
          <input
            style={inp} type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="email@colaborador.com"
            onKeyDown={e => { if (e.key === 'Enter') addToList() }}
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
          <button
            onClick={addToList}
            disabled={!email.trim() || !nome.trim()}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: added ? 'rgba(34,197,94,0.1)' : 'rgba(0,122,255,0.08)', border: `1px solid ${added ? 'rgba(34,197,94,0.3)' : 'rgba(0,122,255,0.2)'}`, borderRadius: 8, padding: '9px 14px', color: added ? '#22c55e' : '#007AFF', cursor: !email.trim() || !nome.trim() ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600, opacity: !email.trim() || !nome.trim() ? 0.5 : 1 }}
          >
            {added ? <><Check size={14} /> Adicionado</> : <><Plus size={14} /> Adicionar à lista</>}
          </button>
        </div>
      </div>

      {/* List of added */}
      {convidados.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {convidados.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 9, padding: '10px 14px' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{c.nome}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)' }}>{c.email}</div>
              </div>
              <button onClick={() => setConvidados(prev => prev.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--logout-btn)', padding: 4, display: 'flex', alignItems: 'center' }}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <button
          onClick={saveAndNext}
          disabled={saving}
          style={{ width: '100%', padding: '14px', background: saving ? '#a0c4ff' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : convidados.length > 0 ? <>Convidar e continuar <ArrowRight size={16} /></> : <>Continuar <ArrowRight size={16} /></>}
        </button>
        <button onClick={skip} style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border-input)', borderRadius: 10, fontSize: 14, color: 'var(--text-3)', cursor: 'pointer' }}>
          Pular este passo
        </button>
      </div>
    </div>
  )
}

// ─── Step 4: Pagamento ────────────────────────────────────────────────────────

function detectCardBrand(num: string): string {
  const n = num.replace(/\D/g, '')
  if (/^4/.test(n)) return 'visa'
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return 'mastercard'
  if (/^3[47]/.test(n)) return 'amex'
  if (/^(401178|438935|451416|457393|636368|627780)/.test(n)) return 'elo'
  return ''
}

const BRAND_LABELS: Record<string, string> = { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', elo: 'Elo' }

function Step4({ userId, onNext }: { userId: string; onNext: () => void }) {
  const [holderName, setHolderName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [expiry, setExpiry] = useState('')
  const [ccv, setCcv] = useState('')
  const [cpf, setCpf] = useState('')
  const [saving, setSaving] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const brand = detectCardBrand(cardNumber)
  const isAmex = brand === 'amex'

  function formatCardNumber(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, isAmex ? 15 : 16)
    if (isAmex) return digits.replace(/(\d{4})(\d{6})(\d{0,5})/, (_, a, b, c) => [a, b, c].filter(Boolean).join(' '))
    return digits.replace(/(.{4})/g, '$1 ').trim()
  }

  function formatExpiry(val: string) {
    const digits = val.replace(/\D/g, '').slice(0, 4)
    return digits.length >= 3 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits
  }

  function formatCpf(val: string) {
    const d = val.replace(/\D/g, '').slice(0, 11)
    if (d.length >= 10) return d.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
    if (d.length >= 7) return d.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3')
    if (d.length >= 4) return d.replace(/(\d{3})(\d{0,3})/, '$1.$2')
    return d
  }

  async function markDone() {
    const supabase = createClient()
    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    const novosPassos = Array.from(new Set([...passos, 'pagamento']))
    await supabase.from('users').update({ onboarding_passos_completos: novosPassos, onboarding_completo: true }).eq('id', userId)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    const parts = expiry.split('/')
    const expiryMonth = parts[0]?.trim()
    const expiryYearShort = parts[1]?.trim()
    if (!expiryMonth || !expiryYearShort) { setError('Validade inválida'); setSaving(false); return }

    const res = await fetch('/api/assinatura/criar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        holderName,
        number: cardNumber.replace(/\s/g, ''),
        expiryMonth,
        expiryYear: expiryYearShort.length === 2 ? `20${expiryYearShort}` : expiryYearShort,
        ccv,
        cpf,
      }),
    })
    const data = await res.json()
    if (data.error) { setError(data.error); setSaving(false); return }

    await markDone()
    setSaving(false); onNext()
  }

  async function skipCard() {
    setSkipping(true)
    await markDone()
    setSkipping(false); onNext()
  }

  const canSubmit = holderName.trim() && cardNumber.replace(/\D/g, '').length >= 15 && expiry.length === 5 && ccv.length >= 3 && cpf.replace(/\D/g, '').length === 11

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Ativar trial de 14 dias</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 300 }}>R$297/mês após 14 dias grátis · Cancele quando quiser.</p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Card number */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>
            Número do cartão {brand && <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{BRAND_LABELS[brand]}</span>}
          </label>
          <input
            style={inp} value={cardNumber} inputMode="numeric" autoComplete="cc-number"
            onChange={e => setCardNumber(formatCardNumber(e.target.value))}
            placeholder="0000 0000 0000 0000"
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

        {/* Holder name */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Nome no cartão</label>
          <input
            style={inp} value={holderName} autoComplete="cc-name"
            onChange={e => setHolderName(e.target.value.toUpperCase())}
            placeholder="NOME COMO NO CARTÃO"
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

        {/* Expiry + CVV */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>Validade</label>
            <input
              style={inp} value={expiry} inputMode="numeric" autoComplete="cc-exp"
              onChange={e => setExpiry(formatExpiry(e.target.value))}
              placeholder="MM/AA"
              onFocus={e => (e.target.style.borderColor = '#007AFF')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>CVV</label>
            <input
              style={inp} value={ccv} inputMode="numeric" autoComplete="cc-csc"
              onChange={e => setCcv(e.target.value.replace(/\D/g, '').slice(0, isAmex ? 4 : 3))}
              placeholder={isAmex ? '0000' : '000'}
              onFocus={e => (e.target.style.borderColor = '#007AFF')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
            />
          </div>
        </div>

        {/* CPF */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--text-2)', marginBottom: 6 }}>CPF do titular</label>
          <input
            style={inp} value={cpf} inputMode="numeric"
            onChange={e => setCpf(formatCpf(e.target.value))}
            placeholder="000.000.000-00"
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />
        </div>

        {error && (
          <p style={{ fontSize: 13, color: '#ff3b30', background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.15)', borderRadius: 8, padding: '10px 14px', margin: 0 }}>
            {error}
          </p>
        )}

        <button
          type="submit" disabled={saving || !canSubmit}
          style={{ width: '100%', padding: '14px', background: saving || !canSubmit ? '#a0c4ff' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: saving || !canSubmit ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 4 }}
        >
          {saving ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Ativando...</> : <>Ativar trial de 14 dias <ArrowRight size={16} /></>}
        </button>
      </form>

      <button
        onClick={skipCard} disabled={skipping}
        style={{ width: '100%', padding: '12px', background: 'none', border: '1px solid var(--border-input)', borderRadius: 10, fontSize: 14, color: 'var(--text-3)', cursor: skipping ? 'not-allowed' : 'pointer' }}
      >
        {skipping ? 'Aguarde...' : 'Configurar cartão depois'}
      </button>
    </div>
  )
}

// ─── Step 4: Fundador ─────────────────────────────────────────────────────────

function FounderStep({ onNext, userId }: { onNext: () => void; userId: string }) {
  const [marking, setMarking] = useState(false)

  async function handleContinue() {
    setMarking(true)
    const supabase = createClient()
    const { data: ud } = await supabase.from('users').select('onboarding_passos_completos').eq('id', userId).single()
    const passos: string[] = ud?.onboarding_passos_completos ?? []
    const novosPassos = Array.from(new Set([...passos, 'pagamento']))
    await supabase.from('users').update({ onboarding_passos_completos: novosPassos, onboarding_completo: true }).eq('id', userId)
    setMarking(false)
    onNext()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, paddingTop: 8 }}>
      <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(251,191,36,0.12)', border: '2px solid rgba(251,191,36,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
        ★
      </div>
      <div>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Você é Fundador!</h2>
        <p style={{ fontSize: 14, color: 'var(--text-3)', fontWeight: 300, lineHeight: 1.6 }}>
          Seu acesso à ARC é vitalício e gratuito.<br />
          Não é necessário cartão de crédito.
        </p>
      </div>
      <div style={{ background: 'rgba(251,191,36,0.08)', border: '1px solid rgba(251,191,36,0.3)', borderRadius: 12, padding: '14px 24px', fontSize: 13, color: '#92400e', fontWeight: 500 }}>
        Plano Fundador — Acesso vitalício incluído
      </div>
      <button
        onClick={handleContinue}
        disabled={marking}
        style={{ padding: '14px 36px', background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 600, cursor: marking ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: 8, opacity: marking ? 0.7 : 1 }}
      >
        {marking ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Aguarde...</> : <>Ir para o painel <ArrowRight size={16} /></>}
      </button>
    </div>
  )
}

// ─── Success screen ───────────────────────────────────────────────────────────

function SuccessScreen({ onGo }: { onGo: () => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 20, paddingTop: 16 }}>
      <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(34,197,94,0.1)', border: '2px solid rgba(34,197,94,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Sparkles size={34} color="#22c55e" />
      </div>
      <div>
        <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Tudo pronto!</h2>
        <p style={{ fontSize: 15, color: 'var(--text-3)', fontWeight: 300, lineHeight: 1.6 }}>
          Bem-vindo à ARC. Seu escritório está configurado<br />e pronto para os primeiros projetos.
        </p>
      </div>
      <button
        onClick={onGo}
        style={{ padding: '14px 40px', background: 'var(--btn-bg)', color: '#fff', border: 'none', borderRadius: 10, fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
      >
        Ir para o painel <ArrowRight size={16} />
      </button>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState('arquiteto')
  const [currentStep, setCurrentStep] = useState<StepId>('perfil')
  const [completed, setCompleted] = useState<StepId[]>([])
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(true)
  const [isFounder, setIsFounder] = useState(false)

  useEffect(() => {
    async function init() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }

      setUserId(user.id)
      setUserName(user.user_metadata?.nome?.split(' ')[0] ?? 'arquiteto')

      const [{ data: ud }, { data: subData }] = await Promise.all([
        supabase.from('users').select('onboarding_completo, onboarding_passos_completos, nivel_permissao').eq('id', user.id).maybeSingle(),
        supabase.from('assinaturas').select('status').eq('user_id', user.id).maybeSingle(),
      ])
      if (subData?.status === 'fundador') setIsFounder(true)

      // Non-owners skip onboarding
      if (ud?.nivel_permissao && ud.nivel_permissao !== 'owner') {
        router.replace('/arquiteto/dashboard'); return
      }

      if (ud?.onboarding_completo) {
        router.replace('/arquiteto/dashboard'); return
      }

      const passos: StepId[] = (ud?.onboarding_passos_completos ?? []) as StepId[]
      setCompleted(passos)

      // Find first incomplete step
      const nextStep = STEPS.find(s => !passos.includes(s.id))
      if (nextStep) setCurrentStep(nextStep.id)
      else setDone(true)

      setLoading(false)
    }
    init()
  }, [router])

  async function markComplete(step: StepId) {
    setCompleted(prev => prev.includes(step) ? prev : [...prev, step])
  }

  function nextStep(step: StepId) {
    markComplete(step)
    const idx = STEPS.findIndex(s => s.id === step)
    if (idx < STEPS.length - 1) {
      setCurrentStep(STEPS[idx + 1].id)
    } else {
      setDone(true)
    }
  }

  async function skipAll() {
    if (!userId) return
    const supabase = createClient()
    await supabase.from('users').update({ onboarding_completo: true }).eq('id', userId)
    router.replace('/arquiteto/dashboard')
  }

  function goToDashboard() {
    router.replace('/arquiteto/dashboard')
  }

  if (loading) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-card)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader2 size={28} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'var(--bg-card)', zIndex: 999, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} @keyframes fadeIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)' }}>
        <span style={{ fontSize: 16, fontWeight: 300, letterSpacing: '0.35em', color: 'var(--accent)' }}>ARC</span>
        {!done && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 300 }}>Olá, {userName}</span>
            <button onClick={skipAll} style={{ background: 'none', border: 'none', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13, fontWeight: 400, textDecoration: 'underline', textDecorationColor: 'rgba(142,142,147,0.4)', padding: '4px 0' }}>
              Pular por enquanto
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '40px 24px 60px' }}>
        <div style={{ width: '100%', maxWidth: 480, animation: 'fadeIn 0.35s ease both' }}>
          {!done ? (
            <>
              <ProgressBar current={currentStep} completed={completed} />
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
                {userId && currentStep === 'perfil'    && <Step1 userId={userId} onNext={() => nextStep('perfil')} />}
                {userId && currentStep === 'projeto'   && <Step2 userId={userId} onNext={() => nextStep('projeto')} onSkip={() => nextStep('projeto')} />}
                {userId && currentStep === 'equipe'    && <Step3 userId={userId} onNext={() => nextStep('equipe')} onSkip={() => nextStep('equipe')} />}
                {userId && currentStep === 'pagamento' && (
                  isFounder
                    ? <FounderStep onNext={() => nextStep('pagamento')} userId={userId} />
                    : <Step4 userId={userId} onNext={() => nextStep('pagamento')} />
                )}
              </div>
            </>
          ) : (
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '40px 32px', boxShadow: '0 2px 16px rgba(0,0,0,0.06)' }}>
              <SuccessScreen onGo={goToDashboard} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
