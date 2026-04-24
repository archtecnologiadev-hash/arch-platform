'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Users, Plus, X, Copy, Check, Trash2, MoreVertical, Loader2, Mail, UserCheck } from 'lucide-react'

interface Membro {
  id: string
  nome: string
  email: string | null
  cargo: string | null
  nivel_permissao: string
  avatar_url: string | null
  is_owner: boolean
}

interface Convite {
  id: string
  email: string
  nome: string
  cargo: string | null
  nivel_permissao: string
  token: string
  created_at: string
}

interface Escritorio {
  id: string
  nome: string
  max_membros: number
  user_id: string
}

const NIVEL_LABEL: Record<string, string> = {
  owner: 'Owner', admin: 'Admin', pleno: 'Pleno', operacional: 'Operacional',
}
const NIVEL_META: Record<string, { bg: string; color: string }> = {
  owner:       { bg: 'rgba(0,122,255,0.1)',   color: '#007AFF' },
  admin:       { bg: 'rgba(139,92,246,0.1)',  color: '#8b5cf6' },
  pleno:       { bg: 'rgba(52,211,153,0.1)',  color: '#059669' },
  operacional: { bg: 'rgba(245,158,11,0.1)',  color: '#d97706' },
}
function nivelMeta(n: string) { return NIVEL_META[n] ?? NIVEL_META.operacional }

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 8, fontSize: 13,
  color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function EquipePage() {
  const [loading, setLoading] = useState(true)
  const [denied, setDenied]   = useState(false)
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null)
  const [membros, setMembros]   = useState<Membro[]>([])
  const [convites, setConvites] = useState<Convite[]>([])
  const [nivelAtual, setNivelAtual] = useState('owner')

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', cargo: '', nivel_permissao: 'operacional' })
  const [saving, setSaving]     = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [linkGerado, setLinkGerado] = useState<string | null>(null)
  const [copiado, setCopiado]   = useState(false)

  const [menuAberto, setMenuAberto] = useState<string | null>(null)
  const [removendo, setRemovendo]   = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }

    // Try owner
    const { data: esc } = await supabase
      .from('escritorios').select('id, nome, max_membros, user_id').eq('user_id', user.id).maybeSingle()

    let escritorioData: Escritorio | null = esc as Escritorio | null
    let nivel = 'owner'

    if (!esc) {
      const { data: ud } = await supabase
        .from('users').select('escritorio_vinculado_id, nivel_permissao').eq('id', user.id).maybeSingle()
      nivel = ud?.nivel_permissao ?? 'operacional'
      if (nivel !== 'admin') { setDenied(true); setLoading(false); return }
      if (ud?.escritorio_vinculado_id) {
        const { data: le } = await supabase
          .from('escritorios').select('id, nome, max_membros, user_id').eq('id', ud.escritorio_vinculado_id).maybeSingle()
        escritorioData = le as Escritorio | null
      }
    }

    if (!escritorioData) { setDenied(true); setLoading(false); return }
    setEscritorio(escritorioData)
    setNivelAtual(nivel)

    // Members: owner + linked
    const { data: raw } = await supabase.from('users').select('id, nome, email, cargo, nivel_permissao, avatar_url')
      .or(`id.eq.${escritorioData.user_id},escritorio_vinculado_id.eq.${escritorioData.id}`)
    if (raw) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setMembros(raw.map((m: any) => ({
        ...m,
        is_owner: m.id === escritorioData!.user_id,
        nivel_permissao: m.id === escritorioData!.user_id ? 'owner' : (m.nivel_permissao ?? 'operacional'),
      })))
    }

    const { data: cvts } = await supabase.from('convites_equipe')
      .select('id, email, nome, cargo, nivel_permissao, token, created_at')
      .eq('escritorio_id', escritorioData.id).eq('status', 'pendente')
      .order('created_at', { ascending: false })
    if (cvts) setConvites(cvts as Convite[])
    setLoading(false)
  }

  async function convidar() {
    if (!form.nome.trim() || !form.email.trim() || !escritorio) return
    setSaving(true); setFormError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (membros.length + convites.length >= (escritorio.max_membros ?? 3)) {
      setFormError(`Limite de ${escritorio.max_membros ?? 3} membros atingido. Faça upgrade do plano.`)
      setSaving(false); return
    }

    const { data, error } = await supabase.from('convites_equipe').insert({
      escritorio_id: escritorio.id,
      email: form.email.trim().toLowerCase(),
      nome: form.nome.trim(),
      cargo: form.cargo.trim() || null,
      nivel_permissao: form.nivel_permissao,
      convidado_por: user?.id,
    }).select('id, email, nome, cargo, nivel_permissao, token, created_at').single()

    if (error) { setFormError(`Erro: ${error.message}`); setSaving(false); return }

    const link = `${window.location.origin}/aceitar-convite?token=${data.token}`
    setLinkGerado(link)
    setConvites(prev => [data as Convite, ...prev])
    setForm({ nome: '', email: '', cargo: '', nivel_permissao: 'operacional' })
    setSaving(false)
  }

  async function copiarLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  async function cancelarConvite(id: string) {
    const supabase = createClient()
    await supabase.from('convites_equipe').update({ status: 'cancelado' }).eq('id', id)
    setConvites(prev => prev.filter(c => c.id !== id))
  }

  async function removerMembro(userId: string) {
    setRemovendo(userId)
    const supabase = createClient()
    await supabase.from('users').update({ escritorio_vinculado_id: null }).eq('id', userId)
    setMembros(prev => prev.filter(m => m.id !== userId))
    setRemovendo(null); setMenuAberto(null)
  }

  function closeModal() { setModalOpen(false); setLinkGerado(null); setFormError(null) }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  if (denied) return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      <Users size={40} color="#c7c7cc" />
      <div style={{ fontSize: 15, fontWeight: 600, color: '#3a3a3c' }}>Acesso restrito</div>
      <div style={{ fontSize: 13, color: '#8e8e93' }}>Apenas owners e admins podem gerenciar a equipe.</div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', padding: '28px 32px' }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}} .menu-btn:hover{background:rgba(0,0,0,0.06)!important}`}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>ESCRITÓRIO</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Users size={20} color="#007AFF" /> Equipe
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b6b', marginTop: 4 }}>
            {membros.length} membro{membros.length !== 1 ? 's' : ''}{convites.length > 0 ? ` · ${convites.length} convite${convites.length !== 1 ? 's' : ''} pendente${convites.length !== 1 ? 's' : ''}` : ''}
          </p>
        </div>
        <button onClick={() => { setModalOpen(true); setFormError(null); setLinkGerado(null) }}
          style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Plus size={14} /> Convidar Membro
        </button>
      </div>

      {/* Active members */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Membros Ativos</p>
        {membros.length === 0 ? (
          <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '40px 20px', textAlign: 'center', color: '#8e8e93' }}>
            <Users size={32} color="#c7c7cc" style={{ marginBottom: 10 }} />
            <div style={{ fontSize: 13 }}>Nenhum membro ainda.</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
            {membros.map(m => {
              const meta = nivelMeta(m.nivel_permissao)
              const initials = m.nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
              return (
                <div key={m.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 46, height: 46, borderRadius: '50%', background: meta.bg, border: `2px solid ${meta.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 700, color: meta.color, flexShrink: 0, overflow: 'hidden' }}>
                      {m.avatar_url ? <img src={m.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 3 }}>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{m.nome}</span>
                        <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20, background: meta.bg, color: meta.color, flexShrink: 0 }}>
                          {NIVEL_LABEL[m.nivel_permissao] ?? m.nivel_permissao}
                        </span>
                      </div>
                      {m.cargo && <div style={{ fontSize: 11.5, color: '#6b6b6b', marginBottom: 2 }}>{m.cargo}</div>}
                      {m.email && <div style={{ fontSize: 11, color: '#aeaeb2' }}>{m.email}</div>}
                    </div>
                    {nivelAtual === 'owner' && !m.is_owner && (
                      <div style={{ position: 'relative', flexShrink: 0 }}>
                        <button className="menu-btn" onClick={() => setMenuAberto(menuAberto === m.id ? null : m.id)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 6, borderRadius: 7, display: 'flex', transition: 'background 0.15s' }}>
                          <MoreVertical size={16} />
                        </button>
                        {menuAberto === m.id && (
                          <div style={{ position: 'absolute', right: 0, top: 30, background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 10, padding: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.12)', zIndex: 20, minWidth: 160 }}>
                            <button onClick={() => removerMembro(m.id)} disabled={!!removendo}
                              style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 10px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', fontSize: 12.5, fontWeight: 500, borderRadius: 7 }}>
                              {removendo === m.id ? <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={13} />}
                              Remover da equipe
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Pending invites */}
      {convites.length > 0 && (
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#8e8e93', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 14 }}>Convites Pendentes</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {convites.map(c => {
              const meta = nivelMeta(c.nivel_permissao)
              const link = `${typeof window !== 'undefined' ? window.location.origin : 'https://www.usearc.com.br'}/aceitar-convite?token=${c.token}`
              return (
                <div key={c.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '14px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 38, height: 38, borderRadius: '50%', background: '#f2f2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Mail size={16} color="#8e8e93" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a' }}>{c.nome}</span>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: meta.bg, color: meta.color }}>
                        {NIVEL_LABEL[c.nivel_permissao] ?? c.nivel_permissao}
                      </span>
                    </div>
                    <div style={{ fontSize: 11.5, color: '#6b6b6b' }}>{c.email}{c.cargo ? ` · ${c.cargo}` : ''}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => copiarLink(link)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', background: 'rgba(0,122,255,0.07)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 7, color: '#007AFF', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                      <Copy size={11} /> Copiar link
                    </button>
                    <button onClick={() => cancelarConvite(c.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 7, color: '#ef4444', fontSize: 11.5, fontWeight: 600, cursor: 'pointer' }}>
                      <X size={11} /> Cancelar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal() }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 460, padding: 28, boxShadow: '0 8px 24px rgba(0,0,0,0.14)', border: '1px solid rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Convidar Membro</div>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93' }}><X size={18} /></button>
            </div>

            {linkGerado ? (
              <div>
                <div style={{ background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 10, padding: '16px 18px', marginBottom: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#007AFF', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <UserCheck size={15} /> Convite criado com sucesso!
                  </div>
                  <div style={{ fontSize: 11.5, color: '#1a1a1a', wordBreak: 'break-all', background: '#f2f2f7', borderRadius: 6, padding: '8px 10px', fontFamily: 'monospace', marginBottom: 12 }}>
                    {linkGerado}
                  </div>
                  <button onClick={() => copiarLink(linkGerado)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center', padding: '10px', background: copiado ? 'rgba(52,211,153,0.1)' : '#007AFF', color: copiado ? '#059669' : '#fff', border: copiado ? '1px solid rgba(52,211,153,0.4)' : 'none', borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {copiado ? <><Check size={14} /> Copiado!</> : <><Copy size={14} /> Copiar link de convite</>}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: '#8e8e93', textAlign: 'center' }}>Envie o link para o membro. Ele expira após ser aceito.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {formError && (
                  <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 14px', fontSize: 12.5, color: '#ef4444' }}>
                    {formError}
                  </div>
                )}
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Nome completo *</label>
                  <input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex: João Silva" style={inp}
                    onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>E-mail *</label>
                  <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="joao@exemplo.com" style={inp}
                    onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Cargo</label>
                  <input value={form.cargo} onChange={e => setForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex: Arquiteto Operacional" style={inp}
                    onFocus={e => (e.target.style.borderColor = '#007AFF')} onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')} />
                </div>
                <div>
                  <label style={{ fontSize: 11, color: '#6b6b6b', display: 'block', marginBottom: 5, fontWeight: 600 }}>Nível de permissão</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['admin', 'pleno', 'operacional'] as const).map(n => {
                      const meta = nivelMeta(n)
                      const sel = form.nivel_permissao === n
                      return (
                        <button key={n} type="button" onClick={() => setForm(f => ({ ...f, nivel_permissao: n }))}
                          style={{ flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: sel ? 600 : 400, borderRadius: 8, cursor: 'pointer', background: sel ? meta.bg : '#f2f2f7', border: `1px solid ${sel ? meta.color : 'rgba(0,0,0,0.08)'}`, color: sel ? meta.color : '#6b6b6b' }}>
                          {NIVEL_LABEL[n]}
                        </button>
                      )
                    })}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 11, color: '#8e8e93' }}>
                    {form.nivel_permissao === 'admin' && 'Pode convidar membros e editar todos os projetos.'}
                    {form.nivel_permissao === 'pleno' && 'Cria e gerencia todos os projetos do escritório.'}
                    {form.nivel_permissao === 'operacional' && 'Acessa apenas projetos onde foi atribuído.'}
                  </div>
                </div>
                <button onClick={convidar} disabled={saving || !form.nome.trim() || !form.email.trim()}
                  style={{ padding: '12px', background: saving || !form.nome.trim() || !form.email.trim() ? 'rgba(0,122,255,0.4)' : '#007AFF', color: '#fff', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 4 }}>
                  {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Gerando convite...</> : <><Plus size={14} /> Gerar link de convite</>}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
