'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { FolderOpen, Plus, ArrowRight, X, AlertCircle } from 'lucide-react'

const PIPELINE_STAGES = ['Atendimento', 'Reunião', 'Briefing', '3D', 'Alt. 3D', 'Detalhamento', 'Orçamento', 'Execução']

const ETAPA_TO_LABEL: Record<string, string> = {
  atendimento: 'Atendimento', reuniao: 'Reunião', briefing: 'Briefing',
  '3d': '3D', alt_3d: 'Alt. 3D', detalhamento: 'Detalhamento',
  orcamento: 'Orçamento', execucao: 'Execução',
  Atendimento: 'Atendimento', 'Reunião': 'Reunião', Briefing: 'Briefing',
  '3D': '3D', 'Alteração 3D': 'Alt. 3D', 'Alt. 3D': 'Alt. 3D',
  Detalhamento: 'Detalhamento', 'Orçamento': 'Orçamento', 'Execução': 'Execução',
}

const TIPO_LABEL: Record<string, string> = {
  residencial: 'Residencial', comercial: 'Comercial', institucional: 'Institucional',
}

const FALLBACK_IMAGES = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?w=600&q=80',
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&q=80',
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&q=80',
]

interface Projeto {
  id: string
  nome: string
  etapa_atual: string | null
  tipo: string | null
  status: string
  created_at: string
}

interface Escritorio {
  id: string
  nome: string
  cidade: string | null
}

export default function ProjetosPage() {
  const [projetos, setProjetos] = useState<Projeto[]>([])
  const [loading, setLoading] = useState(true)
  const [escritorio, setEscritorio] = useState<Escritorio | null>(null)

  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ nome: '', tipo: 'residencial', descricao: '' })
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Only nome is strictly required to create a project
  const perfilCompleto = !!(escritorio?.nome)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: esc } = await supabase
        .from('escritorios').select('id, nome, cidade').eq('user_id', user.id).maybeSingle()

      if (esc) {
        setEscritorio(esc)
        const { data: projs } = await supabase
          .from('projetos').select('*')
          .eq('escritorio_id', esc.id)
          .order('created_at', { ascending: false })
        setProjetos(projs ?? [])
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleCriarProjeto(e: React.FormEvent) {
    e.preventDefault()
    if (!escritorio || !form.nome.trim()) return
    setSaving(true)
    setFormError(null)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('projetos')
      .insert({ escritorio_id: escritorio.id, nome: form.nome.trim(), tipo: form.tipo, descricao: form.descricao || null })
      .select('*').single()

    if (error) {
      console.error('[projetos] insert error:', JSON.stringify({ code: error.code, message: error.message, details: error.details, hint: error.hint }))
      setFormError(error.message ?? 'Erro ao criar projeto. Tente novamente.')
    } else if (data) {
      setProjetos(prev => [data as Projeto, ...prev])
      setModalOpen(false)
      setForm({ nome: '', tipo: 'residencial', descricao: '' })
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <div style={{ width: 24, height: 24, border: '2px solid #007AFF', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', padding: '28px 32px' }}>
      <style>{`
        @keyframes spin{to{transform:rotate(360deg)}}
        .proj-card{border-radius:12px;overflow:hidden;border:1px solid rgba(0,0,0,0.08);background:#fff;cursor:pointer;transition:border-color 0.25s,box-shadow 0.25s;box-shadow:0 1px 3px rgba(0,0,0,0.08);text-decoration:none;display:block}
        .proj-card:hover{border-color:rgba(0,122,255,0.3);box-shadow:0 4px 16px rgba(0,0,0,0.1)}
        .proj-card-img{width:100%;height:100%;object-fit:cover;display:block;transition:transform 0.45s ease}
        .proj-card:hover .proj-card-img{transform:scale(1.06)}
      `}</style>

      <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <p style={{ fontSize: 11, color: '#007AFF', letterSpacing: '0.07em', fontWeight: 700, marginBottom: 4 }}>PIPELINE</p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a' }}>
            Projetos{' '}
            {projetos.length > 0 && (
              <span style={{ fontSize: 14, fontWeight: 400, color: '#8e8e93' }}>({projetos.length})</span>
            )}
          </h1>
        </div>
        {escritorio && (
          perfilCompleto ? (
            <button
              onClick={() => { setModalOpen(true); setFormError(null) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#007AFF', color: '#fff', border: 'none',
                borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              <Plus size={14} /> Novo Projeto
            </button>
          ) : (
            <Link href="/arquiteto/perfil" style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(249,115,22,0.1)', color: '#f97316',
              border: '1px solid rgba(249,115,22,0.3)',
              borderRadius: 10, padding: '10px 18px', fontSize: 13, fontWeight: 600,
              textDecoration: 'none',
            }}>
              <AlertCircle size={14} /> Completar perfil
            </Link>
          )
        )}
      </div>

      {!escritorio ? (
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
          padding: '60px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <FolderOpen size={40} color="#8e8e93" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>
            Configure seu perfil antes de criar projetos.
          </p>
          <Link href="/arquiteto/perfil" style={{ fontSize: 13, color: '#007AFF', textDecoration: 'none' }}>
            Ir para Meu Perfil →
          </Link>
        </div>
      ) : !perfilCompleto ? (
        <div style={{
          background: '#fff', border: '1px solid rgba(249,115,22,0.2)', borderRadius: 14,
          padding: '40px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
          marginBottom: 20,
        }}>
          <AlertCircle size={32} color="#f97316" style={{ marginBottom: 12 }} />
          <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>
            Preencha o nome do escritório no perfil para criar projetos.
          </p>
          <Link href="/arquiteto/perfil" style={{ fontSize: 13, color: '#007AFF', textDecoration: 'none' }}>
            Completar perfil →
          </Link>
        </div>
      ) : projetos.length === 0 ? (
        <div style={{
          background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14,
          padding: '60px 20px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        }}>
          <FolderOpen size={40} color="#8e8e93" style={{ marginBottom: 14 }} />
          <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 14 }}>Nenhum projeto ainda.</p>
          <button
            onClick={() => { setModalOpen(true); setFormError(null) }}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer',
              background: '#007AFF', color: '#fff', border: 'none',
              fontSize: 13, fontWeight: 600,
            }}
          >
            <Plus size={14} /> Criar primeiro projeto
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {projetos.map((proj, i) => {
            const etapaLabel = ETAPA_TO_LABEL[proj.etapa_atual ?? ''] ?? proj.etapa_atual ?? 'Atendimento'
            const stageIdx = PIPELINE_STAGES.findIndex(s => s === etapaLabel)
            const progress = Math.round(((Math.max(0, stageIdx) + 1) / PIPELINE_STAGES.length) * 100)
            const tipoLabel = TIPO_LABEL[proj.tipo ?? ''] ?? proj.tipo ?? 'Residencial'
            const img = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length]

            return (
              <Link key={proj.id} href={`/arquiteto/projetos/${proj.id}`} className="proj-card">
                <div style={{ position: 'relative', height: 180, overflow: 'hidden' }}>
                  <img src={img} alt={proj.nome} className="proj-card-img" />
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.1) 55%, transparent 100%)',
                  }} />
                  <div style={{
                    position: 'absolute', top: 10, right: 10,
                    fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 20,
                    background: 'rgba(255,255,255,0.88)', color: '#007AFF',
                    backdropFilter: 'blur(8px)', border: '1px solid rgba(0,122,255,0.3)',
                  }}>
                    {etapaLabel}
                  </div>
                  <div style={{ position: 'absolute', bottom: 10, left: 14, right: 14 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 700, color: '#fff', lineHeight: 1.25, textShadow: '0 1px 6px rgba(0,0,0,0.6)' }}>
                      {proj.nome}
                    </div>
                    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>{tipoLabel}</div>
                  </div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'rgba(255,255,255,0.2)' }}>
                    <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, rgba(0,122,255,0.6) 0%, #007AFF 100%)' }} />
                  </div>
                </div>
                <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: 11.5, fontWeight: 600, color: '#1a1a1a' }}>{tipoLabel}</div>
                    <div style={{ fontSize: 10, color: '#8e8e93', marginTop: 1 }}>
                      {new Date(proj.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </div>
                  </div>
                  <ArrowRight size={12} color="#007AFF" />
                </div>
              </Link>
            )
          })}
        </div>
      )}

      {/* ── Modal: Novo Projeto ── */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
          }}
          onClick={() => setModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16,
              padding: 32, width: '100%', maxWidth: 480, position: 'relative',
              boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <button onClick={() => setModalOpen(false)} style={{
              position: 'absolute', top: 16, right: 16,
              background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4,
            }}>
              <X size={18} />
            </button>

            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a', marginBottom: 6 }}>Novo Projeto</h2>
            <p style={{ fontSize: 12, color: '#8e8e93', marginBottom: 24 }}>Adicione um novo projeto ao seu pipeline</p>

            <form onSubmit={handleCriarProjeto} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em' }}>
                  Nome do projeto *
                </label>
                <input
                  value={form.nome}
                  onChange={e => setForm(p => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Residência Costa"
                  required
                  style={{
                    width: '100%', padding: '10px 14px', background: '#f2f2f7',
                    border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', fontSize: 13.5,
                    outline: 'none', boxSizing: 'border-box', borderRadius: 10,
                  }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em' }}>
                  Tipo
                </label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['residencial', 'comercial', 'institucional'].map(t => (
                    <button key={t} type="button" onClick={() => setForm(p => ({ ...p, tipo: t }))} style={{
                      flex: 1, padding: '9px 4px', fontSize: 12, fontWeight: 400,
                      borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
                      background: form.tipo === t ? 'rgba(0,122,255,0.1)' : '#f2f2f7',
                      border: `1px solid ${form.tipo === t ? '#007AFF' : 'rgba(0,0,0,0.08)'}`,
                      color: form.tipo === t ? '#007AFF' : '#6b6b6b', textTransform: 'capitalize',
                    }}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, color: '#8e8e93', marginBottom: 6, letterSpacing: '0.04em' }}>
                  Descrição (opcional)
                </label>
                <textarea
                  value={form.descricao}
                  onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))}
                  placeholder="Breve descrição do projeto..."
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 14px', background: '#f2f2f7',
                    border: '1px solid rgba(0,0,0,0.08)', color: '#1a1a1a', fontSize: 13.5,
                    outline: 'none', boxSizing: 'border-box', borderRadius: 10, resize: 'none',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#007AFF')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
                />
              </div>

              {formError && (
                <div style={{
                  padding: '10px 14px', background: 'rgba(239,68,68,0.06)',
                  border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8,
                  fontSize: 12, color: '#ef4444',
                }}>
                  {formError}
                </div>
              )}

              <button
                type="submit"
                disabled={saving || !form.nome.trim()}
                style={{
                  width: '100%', padding: '12px',
                  background: saving || !form.nome.trim() ? 'rgba(0,122,255,0.4)' : '#007AFF',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontSize: 13, fontWeight: 600,
                  cursor: saving || !form.nome.trim() ? 'not-allowed' : 'pointer',
                  marginTop: 4,
                }}
              >
                {saving ? 'Criando...' : 'Criar Projeto'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
