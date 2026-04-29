'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  Plus, X, Edit2, Trash2, ArrowLeft, RefreshCcw, Check,
  Loader2, AlertCircle, ToggleLeft, ToggleRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GastoFixo {
  id: string
  descricao: string
  valor: number
  categoria: string | null
  dia_vencimento: number
  forma_pagamento: string | null
  ativo: boolean
  data_inicio: string
  data_fim: string | null
  observacao: string | null
  frequencia: string | null
  created_at: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIAS = ['Aluguel', 'Energia', 'Internet', 'Software', 'Folha', 'Contador', 'Telefone', 'Seguro', 'Outros']

const FORMAS = [
  { value: 'debito_automatico', label: 'Débito automático' },
  { value: 'pix',              label: 'PIX' },
  { value: 'boleto',           label: 'Boleto' },
  { value: 'cartao_credito',   label: 'Cartão Crédito' },
  { value: 'transferencia',    label: 'Transferência' },
  { value: 'outro',            label: 'Outro' },
]

const FREQUENCIAS = [
  { value: 'mensal',      label: 'Mensal' },
  { value: 'bimestral',   label: 'Bimestral' },
  { value: 'trimestral',  label: 'Trimestral' },
  { value: 'semestral',   label: 'Semestral' },
  { value: 'anual',       label: 'Anual' },
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function freqLabel(f: string | null) {
  return FREQUENCIAS.find(x => x.value === f)?.label ?? 'Mensal'
}
function formaLabel(f: string | null) {
  return FORMAS.find(x => x.value === f)?.label ?? (f ?? '—')
}

function freqMonths(freq: string | null): number {
  switch (freq) {
    case 'bimestral':  return 2
    case 'trimestral': return 3
    case 'semestral':  return 6
    case 'anual':      return 12
    default:           return 1
  }
}

function addMonths(base: Date, n: number): Date {
  const d = new Date(base)
  d.setMonth(d.getMonth() + n)
  return d
}

function vencimentoDate(ano: number, mes: number, dia: number): string {
  const max = new Date(ano, mes, 0).getDate()
  return `${ano}-${String(mes).padStart(2, '0')}-${String(Math.min(dia, max)).padStart(2, '0')}`
}

// ─── Empty form ───────────────────────────────────────────────────────────────

function emptyForm() {
  return {
    descricao: '',
    valor: '',
    categoria: '',
    dia_vencimento: '5',
    forma_pagamento: '',
    data_inicio: new Date().toISOString().slice(0, 10),
    data_fim: '',
    observacao: '',
    frequencia: 'mensal',
    tipo: 'saida' as 'saida' | 'entrada',
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function GastosFixosPage() {
  const router = useRouter()

  const [gastos, setGastos]           = useState<GastoFixo[]>([])
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [userId, setUserId]           = useState<string | null>(null)
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [editingId, setEditingId]     = useState<string | null>(null)
  const [form, setForm]               = useState(emptyForm())
  const [saving, setSaving]           = useState(false)
  const [toast, setToast]             = useState<{ msg: string; ok: boolean } | null>(null)
  const [deletingId, setDeletingId]   = useState<string | null>(null)

  const showToast = (msg: string, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 3000)
  }

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setLoading(false); return }
    setUserId(user.id)

    const { data: escData } = await supabase
      .from('escritorios').select('id').eq('user_id', user.id).maybeSingle()

    let escId = escData?.id ?? null
    if (!escId) {
      const { data: ud } = await supabase
        .from('users').select('escritorio_vinculado_id').eq('id', user.id).maybeSingle()
      escId = ud?.escritorio_vinculado_id ?? null
    }
    if (!escId) { setLoading(false); return }
    setEscritorioId(escId)

    const { data } = await supabase
      .from('financeiro_gastos_fixos')
      .select('*')
      .eq('escritorio_id', escId)
      .order('created_at', { ascending: false })

    setGastos((data ?? []) as GastoFixo[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // Generate future transactions for the next 12 months
  async function gerarMovimentacoes(gasto: GastoFixo, escId: string) {
    const supabase = createClient()
    const interval = freqMonths(gasto.frequencia)
    const agora = new Date()
    const inicioRef = new Date(gasto.data_inicio + 'T12:00:00')
    const fimDate   = gasto.data_fim ? new Date(gasto.data_fim + 'T12:00:00') : null
    const limite    = new Date(agora.getFullYear(), agora.getMonth() + 12, 1)

    // Collect dates to generate
    const datas: string[] = []
    let ref = inicioRef
    while (ref <= limite) {
      if (ref >= agora || ref.getMonth() === agora.getMonth()) {
        const key = vencimentoDate(ref.getFullYear(), ref.getMonth() + 1, gasto.dia_vencimento)
        if (!fimDate || new Date(key + 'T12:00:00') <= fimDate) {
          datas.push(key)
        }
      }
      ref = addMonths(ref, interval)
    }

    if (datas.length === 0) return

    // Check which months already have transactions from this gasto
    const { data: existing } = await supabase
      .from('transacoes_financeiras')
      .select('data_vencimento')
      .eq('escritorio_id', escId)
      .eq('recorrente', true)
      .ilike('observacao', `%gasto_fixo:${gasto.id}%`)

    const existingKeys = new Set((existing ?? []).map((e: { data_vencimento: string }) => e.data_vencimento))
    const toInsert = datas.filter(d => !existingKeys.has(d))

    if (toInsert.length === 0) return

    await supabase.from('transacoes_financeiras').insert(
      toInsert.map(d => ({
        escritorio_id: escId,
        tipo: 'saida' as const,
        descricao: gasto.descricao,
        valor: gasto.valor,
        categoria: gasto.categoria,
        metodo_pagamento: gasto.forma_pagamento,
        status: 'pendente' as const,
        data_vencimento: d,
        recorrente: true,
        observacao: `gasto_fixo:${gasto.id}`,
      }))
    )
  }

  function openNew() {
    setEditingId(null)
    setForm(emptyForm())
    setModalOpen(true)
  }

  function openEdit(g: GastoFixo) {
    setEditingId(g.id)
    setForm({
      descricao: g.descricao,
      valor: String(g.valor),
      categoria: g.categoria ?? '',
      dia_vencimento: String(g.dia_vencimento),
      forma_pagamento: g.forma_pagamento ?? '',
      data_inicio: g.data_inicio,
      data_fim: g.data_fim ?? '',
      observacao: g.observacao ?? '',
      frequencia: g.frequencia ?? 'mensal',
      tipo: 'saida',
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!escritorioId || !form.descricao || !form.valor) return
    const valor = parseFloat(form.valor.replace(',', '.'))
    if (isNaN(valor) || valor <= 0) return
    const dia = parseInt(form.dia_vencimento)
    if (isNaN(dia) || dia < 1 || dia > 31) return

    setSaving(true)
    const supabase = createClient()

    const payload = {
      escritorio_id: escritorioId,
      descricao: form.descricao,
      valor,
      categoria: form.categoria || null,
      dia_vencimento: dia,
      forma_pagamento: form.forma_pagamento || null,
      data_inicio: form.data_inicio,
      data_fim: form.data_fim || null,
      observacao: form.observacao || null,
      frequencia: form.frequencia || 'mensal',
      criado_por: userId,
    }

    if (editingId) {
      await supabase.from('financeiro_gastos_fixos').update(payload).eq('id', editingId)

      // Cancel future pending transactions and regenerate
      await supabase
        .from('transacoes_financeiras')
        .update({ status: 'cancelado' })
        .eq('recorrente', true)
        .ilike('observacao', `%gasto_fixo:${editingId}%`)
        .eq('status', 'pendente')

      const updatedGasto = { ...payload, id: editingId, ativo: true, created_at: '' } as GastoFixo
      await gerarMovimentacoes(updatedGasto, escritorioId)

      showToast('Gasto fixo atualizado')
    } else {
      const { data } = await supabase
        .from('financeiro_gastos_fixos')
        .insert(payload)
        .select('*').single()

      if (data) {
        await gerarMovimentacoes(data as GastoFixo, escritorioId)
        showToast('Gasto fixo criado e movimentações geradas')
      }
    }

    setSaving(false)
    setModalOpen(false)
    await load()
  }

  async function handleToggleAtivo(g: GastoFixo) {
    const supabase = createClient()
    const novoAtivo = !g.ativo
    await supabase.from('financeiro_gastos_fixos').update({ ativo: novoAtivo }).eq('id', g.id)

    if (!novoAtivo) {
      // Cancel future pending transactions
      await supabase
        .from('transacoes_financeiras')
        .update({ status: 'cancelado' })
        .eq('recorrente', true)
        .ilike('observacao', `%gasto_fixo:${g.id}%`)
        .eq('status', 'pendente')
      showToast('Gasto fixo desativado — movimentações futuras canceladas')
    } else {
      // Regenerate future transactions
      if (escritorioId) await gerarMovimentacoes({ ...g, ativo: true }, escritorioId)
      showToast('Gasto fixo reativado — movimentações geradas')
    }

    setGastos(prev => prev.map(x => x.id === g.id ? { ...x, ativo: novoAtivo } : x))
  }

  async function handleDelete(g: GastoFixo) {
    if (!confirm('Excluir este gasto fixo? Movimentações futuras pendentes serão canceladas.')) return
    setDeletingId(g.id)
    const supabase = createClient()

    // Cancel future pending
    await supabase
      .from('transacoes_financeiras')
      .update({ status: 'cancelado' })
      .eq('recorrente', true)
      .ilike('observacao', `%gasto_fixo:${g.id}%`)
      .eq('status', 'pendente')

    await supabase.from('financeiro_gastos_fixos').delete().eq('id', g.id)
    setGastos(prev => prev.filter(x => x.id !== g.id))
    setDeletingId(null)
    showToast('Gasto fixo excluído')
  }

  // ── Computed ────────────────────────────────────────────────────────────────
  const totalMensal = gastos.filter(g => g.ativo).reduce((s, g) => s + g.valor, 0)

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Loader2 size={22} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border-input)', background: 'var(--bg-input)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em',
    textTransform: 'uppercase', marginBottom: 5, display: 'block',
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', background: '#1a1a1a', color: '#fff', padding: '12px 20px', borderRadius: 12, fontSize: 13, zIndex: 9999, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 30px rgba(0,0,0,0.3)', whiteSpace: 'nowrap' }}>
          {toast.ok ? <Check size={15} color="#34d399" /> : <AlertCircle size={15} color="#ff3b30" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="sticky-page-header" style={{ padding: '0 32px', height: 70, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <button
            onClick={() => router.push('/arquiteto/financeiro')}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 13, fontWeight: 500, padding: '6px 8px', borderRadius: 8 }}
          >
            <ArrowLeft size={16} /> Financeiro
          </button>
          <div style={{ width: 1, height: 20, background: 'var(--border)' }} />
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Financeiro</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Gastos Fixos</div>
          </div>
        </div>
        <button onClick={openNew} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: 'var(--btn-bg)', border: 'none', borderRadius: 8, fontSize: 13, color: 'var(--btn-text)', cursor: 'pointer', fontWeight: 600 }}>
          <Plus size={14} /> Novo gasto fixo
        </button>
      </div>

      <div style={{ padding: '28px 32px' }}>
        {/* Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 24 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>Total mensal ativo</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#ef4444' }}>{fmtBRL(totalMensal)}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>Gastos ativos</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--text)' }}>{gastos.filter(g => g.ativo).length}</div>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 12, color: 'var(--text-2)', marginBottom: 10 }}>Total anual projetado</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{fmtBRL(totalMensal * 12)}</div>
          </div>
        </div>

        {/* Table */}
        {gastos.length === 0 ? (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
            <RefreshCcw size={32} color="var(--text-3)" style={{ marginBottom: 14, opacity: 0.4 }} />
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Nenhum gasto fixo cadastrado</div>
            <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Cadastre aluguel, internet, software e outros custos recorrentes.</div>
            <button onClick={openNew} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
              <Plus size={14} /> Cadastrar gasto fixo
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Descrição', 'Categoria', 'Valor', 'Frequência', 'Dia venc.', 'Forma', 'Início', 'Status', ''].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {gastos.map(g => (
                    <tr key={g.id} style={{ borderBottom: '1px solid var(--border-subtle)', opacity: g.ativo ? 1 : 0.5 }}>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)' }}>{g.descricao}</div>
                        {g.observacao && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{g.observacao}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        {g.categoria ? (
                          <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 6, background: 'var(--bg)', color: 'var(--text-2)', fontWeight: 500 }}>{g.categoria}</span>
                        ) : <span style={{ color: 'var(--text-3)' }}>—</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#ef4444', whiteSpace: 'nowrap' }}>
                        {fmtBRL(g.valor)}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <RefreshCcw size={11} color="var(--text-3)" />
                          {freqLabel(g.frequencia)}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)' }}>
                        Dia {g.dia_vencimento}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                        {formaLabel(g.forma_pagamento)}
                      </td>
                      <td style={{ padding: '12px 14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>
                        {new Date(g.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR')}
                        {g.data_fim && <div style={{ fontSize: 10, color: 'var(--text-3)' }}>até {new Date(g.data_fim + 'T12:00:00').toLocaleDateString('pt-BR')}</div>}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 600, background: g.ativo ? 'rgba(16,185,129,0.12)' : 'rgba(142,142,147,0.12)', color: g.ativo ? '#10b981' : '#8e8e93' }}>
                          {g.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <button title={g.ativo ? 'Desativar' : 'Reativar'} onClick={() => handleToggleAtivo(g)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: g.ativo ? '#10b981' : 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                            {g.ativo ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                          </button>
                          <button title="Editar" onClick={() => openEdit(g)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                            <Edit2 size={14} />
                          </button>
                          <button title="Excluir" onClick={() => handleDelete(g)} disabled={deletingId === g.id}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}>
                            {deletingId === g.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 540, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {editingId ? 'Editar gasto fixo' : 'Novo gasto fixo'}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={20} /></button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Descrição */}
              <div>
                <label style={labelStyle}>Descrição *</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Aluguel do escritório" style={inputStyle} />
              </div>

              {/* Valor + Frequência */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Valor (R$) *</label>
                  <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" style={inputStyle} type="text" inputMode="decimal" />
                </div>
                <div>
                  <label style={labelStyle}>Frequência</label>
                  <select value={form.frequencia} onChange={e => setForm(f => ({ ...f, frequencia: e.target.value }))} style={inputStyle}>
                    {FREQUENCIAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Categoria + Dia vencimento */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Categoria</label>
                  <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={inputStyle}>
                    <option value="">Selecionar...</option>
                    {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Dia de vencimento (1–31) *</label>
                  <input value={form.dia_vencimento} onChange={e => setForm(f => ({ ...f, dia_vencimento: e.target.value }))} placeholder="5" style={inputStyle} type="number" min={1} max={31} />
                </div>
              </div>

              {/* Forma de pagamento */}
              <div>
                <label style={labelStyle}>Forma de pagamento padrão</label>
                <select value={form.forma_pagamento} onChange={e => setForm(f => ({ ...f, forma_pagamento: e.target.value }))} style={inputStyle}>
                  <option value="">Selecionar...</option>
                  {FORMAS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
              </div>

              {/* Datas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Data de início</label>
                  <input type="date" value={form.data_inicio} onChange={e => setForm(f => ({ ...f, data_inicio: e.target.value }))} style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Data de fim (opcional)</label>
                  <input type="date" value={form.data_fim} onChange={e => setForm(f => ({ ...f, data_fim: e.target.value }))} style={inputStyle} />
                </div>
              </div>

              {/* Observação */}
              <div>
                <label style={labelStyle}>Observação</label>
                <textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Ex: Contrato até dez/2025" rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>

              {/* Preview */}
              {form.valor && form.dia_vencimento && (
                <div style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.15)', borderRadius: 10, padding: '12px 16px', fontSize: 12, color: '#6366f1' }}>
                  <span style={{ fontWeight: 700 }}>{freqLabel(form.frequencia)}</span> · todo dia <span style={{ fontWeight: 700 }}>{form.dia_vencimento}</span> · <span style={{ fontWeight: 700 }}>{fmtBRL(parseFloat(form.valor.replace(',', '.')) || 0)}</span>
                  <span style={{ color: 'var(--text-3)', marginLeft: 8 }}>→ Gera movimentações futuras automaticamente</span>
                </div>
              )}
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: '9px 18px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.descricao || !form.valor || !form.dia_vencimento}
                style={{ padding: '9px 20px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.descricao || !form.valor ? 0.5 : 1 }}>
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : 'Criar e gerar movimentações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
