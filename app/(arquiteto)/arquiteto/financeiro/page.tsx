'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import {
  Plus, Download, TrendingUp, TrendingDown, Wallet, Clock,
  X, Check, Edit2, Trash2, FileCheck, Receipt, Settings,
  Layers, RefreshCcw,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line, Legend,
} from 'recharts'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transacao {
  id: string
  tipo: 'entrada' | 'saida'
  categoria: string | null
  descricao: string
  valor: number
  metodo_pagamento: string | null
  status: 'pendente' | 'pago' | 'atrasado' | 'cancelado'
  data_vencimento: string | null
  data_pagamento: string | null
  nota_fiscal_emitida: boolean
  numero_nota_fiscal: string | null
  observacao: string | null
  projeto_id: string | null
  cliente_id: string | null
  created_at: string
  projeto_nome?: string | null
  cliente_nome?: string | null
  parcela_atual?: number | null
  total_parcelas?: number | null
  movimentacao_pai_id?: string | null
  recorrente?: boolean
}

interface Projeto { id: string; nome: string }
interface Cliente { id: string; nome: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const CATS_ENTRADA = ['Honorários', 'Sinal', 'Parcela', 'Comissão', 'Recorrente', 'Outros']
const CATS_SAIDA   = ['Fornecedor', 'Material', 'Operacional', 'Marketing', 'Impostos', 'Aluguel', 'Outros']

const METODOS = [
  { value: 'pix',            label: 'PIX' },
  { value: 'transferencia',  label: 'Transferência' },
  { value: 'boleto',         label: 'Boleto' },
  { value: 'cartao_credito', label: 'Cartão Crédito' },
  { value: 'cartao_debito',  label: 'Cartão Débito' },
  { value: 'dinheiro',       label: 'Dinheiro' },
  { value: 'outro',          label: 'Outro' },
]

const STATUS_OPTS = [
  { value: 'pendente',  label: 'Pendente',  color: '#f59e0b' },
  { value: 'pago',      label: 'Pago',      color: '#10b981' },
  { value: 'atrasado',  label: 'Atrasado',  color: '#ef4444' },
  { value: 'cancelado', label: 'Cancelado', color: '#8e8e93' },
]

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmtBRL  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string | null) => d ? new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') : '—'

function statusBadge(status: string) {
  return STATUS_OPTS.find(x => x.value === status) ?? { label: status, color: '#8e8e93' }
}

function metodoLabel(m: string | null) {
  if (!m) return '—'
  return METODOS.find(x => x.value === m)?.label ?? m
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setMonth(d.getMonth() + n)
  return d.toISOString().slice(0, 10)
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// ─── Empty form ───────────────────────────────────────────────────────────────

function emptyForm() {
  return {
    tipo: 'entrada' as 'entrada' | 'saida',
    descricao: '',
    valor: '',
    categoria: '',
    projeto_id: '',
    cliente_id: '',
    metodo_pagamento: '',
    status: 'pendente',
    data_vencimento: '',
    data_pagamento: '',
    nota_fiscal_emitida: false,
    numero_nota_fiscal: '',
    observacao: '',
    parcelar: false,
    num_parcelas: '2',
    primeira_parcela: new Date().toISOString().slice(0, 10),
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FinanceiroPage() {
  const router = useRouter()

  const [transacoes, setTransacoes]     = useState<Transacao[]>([])
  const [projetos, setProjetos]         = useState<Projeto[]>([])
  const [clientes, setClientes]         = useState<Cliente[]>([])
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [nivelRank, setNivelRank]       = useState(2)
  const [loading, setLoading]           = useState(true)
  const [activeTab, setActiveTab]       = useState<'transacoes' | 'fluxo'>('transacoes')

  // filters
  const [filterTipo, setFilterTipo]       = useState<string>('')
  const [filterStatus, setFilterStatus]   = useState<string>('')
  const [filterBusca, setFilterBusca]     = useState('')
  const [filterMes, setFilterMes]         = useState<string>('')

  // modal
  const [modalOpen, setModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm]           = useState(emptyForm())
  const [saving, setSaving]       = useState(false)

  // edit parcelas modal
  const [editParcelasModal, setEditParcelasModal] = useState<{ paiId: string; novoValor: string } | null>(null)
  const [savingParcelas, setSavingParcelas]       = useState(false)

  // NF modal
  const [nfModal, setNfModal] = useState<{ id: string; numero: string } | null>(null)

  const canEdit = nivelRank >= 1

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: userData }, { data: escData }] = await Promise.all([
      supabase.from('users').select('nivel_permissao').eq('id', user.id).maybeSingle(),
      supabase.from('escritorios').select('id').eq('user_id', user.id).maybeSingle(),
    ])

    const NIVEL_RANK: Record<string, number> = { operacional: 0, gestor: 1, owner: 2 }
    const nivel = userData?.nivel_permissao ?? 'owner'
    const rank  = NIVEL_RANK[nivel] ?? 2
    setNivelRank(rank)

    let escId = escData?.id ?? null
    if (!escId && rank < 2) {
      const { data: linkedUser } = await supabase
        .from('users').select('escritorio_vinculado_id').eq('id', user.id).maybeSingle()
      escId = linkedUser?.escritorio_vinculado_id ?? null
    }
    if (!escId) { setLoading(false); return }
    setEscritorioId(escId)

    const [{ data: txData }, { data: projData }, { data: clientData }] = await Promise.all([
      supabase
        .from('transacoes_financeiras')
        .select('*, projetos(nome), users!transacoes_financeiras_cliente_id_fkey(nome)')
        .eq('escritorio_id', escId)
        .order('data_vencimento', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false }),
      supabase.from('projetos').select('id, nome').eq('escritorio_id', escId).order('nome'),
      supabase.from('users').select('id, nome').not('escritorio_vinculado_id', 'is', null).limit(200),
    ])

    if (txData) {
      setTransacoes(txData.map((t: Record<string, unknown>) => ({
        ...t,
        projeto_nome: (t.projetos as { nome: string } | null)?.nome ?? null,
        cliente_nome: (t['users!transacoes_financeiras_cliente_id_fkey'] as { nome: string } | null)?.nome ?? null,
      })) as Transacao[])
    }
    if (projData)  setProjetos(projData as Projeto[])
    if (clientData) setClientes(clientData as Cliente[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Computed ──────────────────────────────────────────────────────────────

  const filtered = transacoes.filter(t => {
    if (filterTipo   && t.tipo   !== filterTipo)   return false
    if (filterStatus && t.status !== filterStatus) return false
    if (filterBusca  && !t.descricao.toLowerCase().includes(filterBusca.toLowerCase()) && !(t.projeto_nome ?? '').toLowerCase().includes(filterBusca.toLowerCase())) return false
    if (filterMes) {
      const d = t.data_vencimento ?? t.data_pagamento ?? t.created_at
      if (d.slice(0, 7) !== filterMes) return false
    }
    return true
  })

  const totalEntrada = transacoes.filter(t => t.tipo === 'entrada' && t.status !== 'cancelado').reduce((s, t) => s + t.valor, 0)
  const totalSaida   = transacoes.filter(t => t.tipo === 'saida'   && t.status !== 'cancelado').reduce((s, t) => s + t.valor, 0)
  const saldo        = totalEntrada - totalSaida
  const pendente     = transacoes.filter(t => t.tipo === 'entrada' && t.status === 'pendente').reduce((s, t) => s + t.valor, 0)

  // Bar chart: last 6 months
  const barData = (() => {
    const now = new Date()
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1)
      const key = monthKey(d)
      const entrada = transacoes
        .filter(t => t.tipo === 'entrada' && t.status !== 'cancelado' && (t.data_pagamento ?? t.data_vencimento ?? t.created_at).slice(0, 7) === key)
        .reduce((s, t) => s + t.valor, 0)
      const saida = transacoes
        .filter(t => t.tipo === 'saida' && t.status !== 'cancelado' && (t.data_pagamento ?? t.data_vencimento ?? t.created_at).slice(0, 7) === key)
        .reduce((s, t) => s + t.valor, 0)
      return { label: MONTH_NAMES[d.getMonth()], entrada, saida }
    })
  })()

  // Fluxo de caixa: next 12 months projection
  const fluxoData = (() => {
    const now = new Date()
    let saldoAcum = transacoes
      .filter(t => t.status === 'pago' && !['cancelado'].includes(t.status))
      .reduce((s, t) => s + (t.tipo === 'entrada' ? t.valor : -t.valor), 0)

    return Array.from({ length: 12 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() + i, 1)
      const key = monthKey(d)
      const entradas = transacoes
        .filter(t => t.tipo === 'entrada' && ['pendente', 'atrasado'].includes(t.status) && (t.data_vencimento ?? '').slice(0, 7) === key)
        .reduce((s, t) => s + t.valor, 0)
      const saidas = transacoes
        .filter(t => t.tipo === 'saida' && ['pendente', 'atrasado'].includes(t.status) && (t.data_vencimento ?? '').slice(0, 7) === key)
        .reduce((s, t) => s + t.valor, 0)
      saldoAcum += entradas - saidas
      return {
        label: `${MONTH_NAMES[d.getMonth()]}/${String(d.getFullYear()).slice(2)}`,
        entradas,
        saidas,
        saldo: saldoAcum,
      }
    })
  })()

  // Preview parcelas
  const parcelaValor = form.parcelar && form.valor && form.num_parcelas
    ? parseFloat(form.valor.replace(',', '.')) / parseInt(form.num_parcelas)
    : 0

  // ── CSV Export ────────────────────────────────────────────────────────────

  function exportCSV() {
    const rows = [
      ['Tipo', 'Categoria', 'Descrição', 'Valor', 'Status', 'Método', 'Vencimento', 'Pagamento', 'NF', 'Nº NF', 'Projeto', 'Parcela', 'Observação'],
      ...filtered.map(t => [
        t.tipo, t.categoria ?? '', t.descricao, t.valor.toFixed(2).replace('.', ','),
        t.status, metodoLabel(t.metodo_pagamento), fmtDate(t.data_vencimento), fmtDate(t.data_pagamento),
        t.nota_fiscal_emitida ? 'Sim' : 'Não', t.numero_nota_fiscal ?? '',
        t.projeto_nome ?? '',
        t.parcela_atual && t.total_parcelas ? `${t.parcela_atual}/${t.total_parcelas}` : '',
        t.observacao ?? '',
      ]),
    ]
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `financeiro_${new Date().toISOString().slice(0, 10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  function exportFluxoPDF() {
    const rows = fluxoData.map(m =>
      `<tr>
        <td>${m.label}</td>
        <td style="color:#10b981">${fmtBRL(m.entradas)}</td>
        <td style="color:#ef4444">${fmtBRL(m.saidas)}</td>
        <td style="color:${m.saldo >= 0 ? '#10b981' : '#ef4444'};font-weight:700">${fmtBRL(m.saldo)}</td>
      </tr>`
    ).join('')
    const html = `<!DOCTYPE html><html><head><title>Fluxo de Caixa</title><style>
      body{font-family:sans-serif;padding:24px;color:#222;font-size:12px}
      h1{font-size:18px}table{width:100%;border-collapse:collapse;margin-top:16px}
      th{text-align:left;border-bottom:2px solid #000;padding:6px 10px;font-size:10px;text-transform:uppercase;letter-spacing:.06em}
      td{padding:8px 10px;border-bottom:1px solid #eee}
    </style></head><body>
      <h1>Fluxo de Caixa Projetado</h1>
      <p style="color:#666">Gerado em ${new Date().toLocaleDateString('pt-BR')}</p>
      <table><thead><tr><th>Mês</th><th>Entradas</th><th>Saídas</th><th>Saldo Projetado</th></tr></thead>
      <tbody>${rows}</tbody></table>
    </body></html>`
    const w = window.open('', '_blank')
    if (!w) return
    w.document.write(html)
    w.document.close()
    w.onload = () => w.print()
  }

  // ── Modal helpers ──────────────────────────────────────────────────────────

  function openNew(tipo: 'entrada' | 'saida') {
    setEditingId(null)
    setForm({ ...emptyForm(), tipo })
    setModalOpen(true)
  }

  function openEdit(t: Transacao) {
    setEditingId(t.id)
    setForm({
      tipo: t.tipo,
      descricao: t.descricao,
      valor: String(t.valor),
      categoria: t.categoria ?? '',
      projeto_id: t.projeto_id ?? '',
      cliente_id: t.cliente_id ?? '',
      metodo_pagamento: t.metodo_pagamento ?? '',
      status: t.status,
      data_vencimento: t.data_vencimento ?? '',
      data_pagamento: t.data_pagamento ?? '',
      nota_fiscal_emitida: t.nota_fiscal_emitida,
      numero_nota_fiscal: t.numero_nota_fiscal ?? '',
      observacao: t.observacao ?? '',
      parcelar: false,
      num_parcelas: '2',
      primeira_parcela: new Date().toISOString().slice(0, 10),
    })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!escritorioId || !form.descricao || !form.valor) return
    setSaving(true)
    const supabase = createClient()

    const valorTotal = parseFloat(form.valor.replace(',', '.'))
    if (isNaN(valorTotal)) { setSaving(false); return }

    const basePayload = {
      escritorio_id: escritorioId,
      tipo: form.tipo,
      categoria: form.categoria || null,
      projeto_id: form.projeto_id || null,
      cliente_id: form.cliente_id || null,
      metodo_pagamento: form.metodo_pagamento || null,
      status: form.status,
      data_vencimento: form.data_vencimento || null,
      data_pagamento: form.data_pagamento || null,
      nota_fiscal_emitida: form.nota_fiscal_emitida,
      numero_nota_fiscal: form.numero_nota_fiscal || null,
      observacao: form.observacao || null,
    }

    if (editingId) {
      await supabase.from('transacoes_financeiras').update({
        ...basePayload,
        descricao: form.descricao,
        valor: valorTotal,
      }).eq('id', editingId)
    } else if (form.parcelar && parseInt(form.num_parcelas) >= 2) {
      const n = Math.min(60, Math.max(2, parseInt(form.num_parcelas)))
      const valorParcela = Math.round((valorTotal / n) * 100) / 100

      // Insert parent first to get its ID
      const { data: pai } = await supabase.from('transacoes_financeiras').insert({
        ...basePayload,
        descricao: `${form.descricao} (1/${n})`,
        valor: valorParcela,
        data_vencimento: form.primeira_parcela || null,
        parcela_atual: 1,
        total_parcelas: n,
        recorrente: false,
      }).select('id').single()

      if (pai) {
        const parcelas = Array.from({ length: n - 1 }, (_, i) => ({
          ...basePayload,
          descricao: `${form.descricao} (${i + 2}/${n})`,
          valor: valorParcela,
          data_vencimento: form.primeira_parcela ? addMonths(form.primeira_parcela, i + 1) : null,
          parcela_atual: i + 2,
          total_parcelas: n,
          movimentacao_pai_id: pai.id,
          recorrente: false,
        }))
        await supabase.from('transacoes_financeiras').insert(parcelas)
      }
    } else {
      await supabase.from('transacoes_financeiras').insert({
        ...basePayload,
        descricao: form.descricao,
        valor: valorTotal,
      })
    }

    setSaving(false)
    setModalOpen(false)
    await load()
  }

  async function handleDelete(t: Transacao) {
    const isPai = transacoes.some(x => x.movimentacao_pai_id === t.id)
    const isFilho = !!t.movimentacao_pai_id

    let msg = 'Excluir esta transação?'
    if (isPai) msg = 'Esta é a primeira parcela de uma série. Excluir todas as parcelas desta série?'
    if (isFilho) msg = 'Excluir esta parcela?'

    if (!confirm(msg)) return
    const supabase = createClient()
    await supabase.from('transacoes_financeiras').delete().eq('id', t.id)
    if (isPai) {
      await supabase.from('transacoes_financeiras').delete().eq('movimentacao_pai_id', t.id)
      setTransacoes(prev => prev.filter(x => x.id !== t.id && x.movimentacao_pai_id !== t.id))
    } else {
      setTransacoes(prev => prev.filter(x => x.id !== t.id))
    }
  }

  async function toggleStatus(t: Transacao) {
    const next = t.status === 'pago' ? 'pendente' : 'pago'
    const supabase = createClient()
    await supabase.from('transacoes_financeiras').update({
      status: next,
      data_pagamento: next === 'pago' ? new Date().toISOString().slice(0, 10) : null,
    }).eq('id', t.id)
    setTransacoes(prev => prev.map(x => x.id === t.id ? { ...x, status: next as Transacao['status'], data_pagamento: next === 'pago' ? new Date().toISOString().slice(0, 10) : null } : x))
  }

  async function saveNF(id: string, numero: string) {
    const supabase = createClient()
    await supabase.from('transacoes_financeiras').update({ nota_fiscal_emitida: true, numero_nota_fiscal: numero || null }).eq('id', id)
    setTransacoes(prev => prev.map(x => x.id === id ? { ...x, nota_fiscal_emitida: true, numero_nota_fiscal: numero || null } : x))
    setNfModal(null)
  }

  async function handleEditParcelasRestantes() {
    if (!editParcelasModal) return
    const novoValor = parseFloat(editParcelasModal.novoValor.replace(',', '.'))
    if (isNaN(novoValor)) return
    setSavingParcelas(true)
    const supabase = createClient()

    // Update all future pending parcelas with same paiId
    const filhos = transacoes.filter(t =>
      t.movimentacao_pai_id === editParcelasModal.paiId &&
      ['pendente', 'atrasado'].includes(t.status)
    )
    if (filhos.length > 0) {
      const ids = filhos.map(t => t.id)
      await supabase.from('transacoes_financeiras').update({ valor: novoValor }).in('id', ids)
    }
    // Also update the pai if still pending
    const pai = transacoes.find(t => t.id === editParcelasModal.paiId && ['pendente', 'atrasado'].includes(t.status))
    if (pai) {
      await supabase.from('transacoes_financeiras').update({ valor: novoValor }).eq('id', editParcelasModal.paiId)
    }

    setSavingParcelas(false)
    setEditParcelasModal(null)
    await load()
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Carregando...</span>
    </div>
  )

  const cats      = form.tipo === 'entrada' ? CATS_ENTRADA : CATS_SAIDA
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
      <style>{`
        .fin-table tr:hover td { background: var(--bg-hover); }
        .fin-action-btn { opacity: 0; transition: opacity 0.15s; }
        .fin-table tr:hover .fin-action-btn { opacity: 1; }
        @media (max-width: 768px) { .fin-action-btn { opacity: 1; } }
      `}</style>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky-page-header" style={{
        borderBottom: '1px solid var(--border)', background: 'var(--bg-card)',
        position: 'sticky', top: 0, zIndex: 30, boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div style={{ padding: '0 32px', height: 70, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Módulo</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Financeiro</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button
              onClick={() => router.push('/arquiteto/financeiro/gastos-fixos')}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}
            >
              <Settings size={14} /> Gastos Fixos
            </button>
            <button onClick={exportCSV} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
              <Download size={14} /> CSV
            </button>
            {canEdit && activeTab === 'transacoes' && (
              <>
                <button onClick={() => openNew('saida')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 13, color: '#ef4444', cursor: 'pointer', fontWeight: 600 }}>
                  <Plus size={14} /> Nova saída
                </button>
                <button onClick={() => openNew('entrada')} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, fontSize: 13, color: '#10b981', cursor: 'pointer', fontWeight: 600 }}>
                  <Plus size={14} /> Nova entrada
                </button>
              </>
            )}
            {activeTab === 'fluxo' && (
              <button onClick={exportFluxoPDF} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
                <Download size={14} /> Exportar PDF
              </button>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ padding: '0 32px', display: 'flex', gap: 0, borderTop: '1px solid var(--border)' }}>
          {([
            { key: 'transacoes', label: 'Transações', icon: <Wallet size={14} /> },
            { key: 'fluxo',      label: 'Fluxo de Caixa', icon: <Layers size={14} /> },
          ] as const).map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '12px 18px', background: 'none', border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: activeTab === tab.key ? 700 : 500,
                color: activeTab === tab.key ? 'var(--text)' : 'var(--text-3)',
                borderBottom: activeTab === tab.key ? '2px solid var(--accent)' : '2px solid transparent',
                transition: 'color 0.15s',
              }}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ padding: '28px 32px' }}>

        {/* ── Summary Cards ──────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
          {[
            { title: 'Total Entradas', value: fmtBRL(totalEntrada), icon: TrendingUp,   color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
            { title: 'Total Saídas',   value: fmtBRL(totalSaida),   icon: TrendingDown, color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
            { title: 'Saldo',          value: fmtBRL(saldo),        icon: Wallet,       color: saldo >= 0 ? '#10b981' : '#ef4444', bg: saldo >= 0 ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)' },
            { title: 'Pend. Receber',  value: fmtBRL(pendente),     icon: Clock,        color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
          ].map(card => {
            const Icon = card.icon
            return (
              <div key={card.title} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '18px 20px', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{card.title}</span>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={14} color={card.color} />
                  </div>
                </div>
                <div style={{ fontSize: 22, fontWeight: 700, color: card.color, lineHeight: 1 }}>{card.value}</div>
              </div>
            )
          })}
        </div>

        {/* ── TAB: TRANSAÇÕES ────────────────────────────────────────────────── */}
        {activeTab === 'transacoes' && (
          <>
            {/* Bar chart */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 16 }}>Últimos 6 meses</div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => [fmtBRL(Number(value)), name === 'entrada' ? 'Entradas' : 'Saídas'] as [string, string]}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Bar dataKey="entrada" name="entrada" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                  <Bar dataKey="saida"   name="saida"   fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
              <div style={{ display: 'flex', gap: 16, marginTop: 8, justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#10b981' }} /> Entradas
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-2)' }}>
                  <div style={{ width: 10, height: 10, borderRadius: 2, background: '#ef4444' }} /> Saídas
                </div>
              </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={filterBusca} onChange={e => setFilterBusca(e.target.value)} placeholder="Buscar..." style={{ ...inputStyle, width: 240, flex: 'none' }} />
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
                <option value="">Todos os tipos</option>
                <option value="entrada">Entradas</option>
                <option value="saida">Saídas</option>
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
                <option value="">Todos os status</option>
                {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <input type="month" value={filterMes} onChange={e => setFilterMes(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }} />
              {(filterTipo || filterStatus || filterBusca || filterMes) && (
                <button onClick={() => { setFilterTipo(''); setFilterStatus(''); setFilterBusca(''); setFilterMes('') }} style={{ ...inputStyle, width: 'auto', flex: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                  Limpar
                </button>
              )}
            </div>

            {/* Table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              {filtered.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-3)', fontSize: 14 }}>Nenhuma transação encontrada.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="fin-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)' }}>
                        {['Tipo', 'Descrição', 'Valor', 'Status', 'Vencimento', 'Pagamento', 'Método', 'Projeto', 'NF', ''].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(t => {
                        const sb  = statusBadge(t.status)
                        const isPai = transacoes.some(x => x.movimentacao_pai_id === t.id)
                        return (
                          <tr key={t.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: t.tipo === 'entrada' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)', color: t.tipo === 'entrada' ? '#10b981' : '#ef4444' }}>
                                {t.tipo === 'entrada' ? '+ Entrada' : '− Saída'}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px', maxWidth: 220 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span style={{ fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{t.descricao}</span>
                                {t.total_parcelas && (
                                  <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 10, background: 'rgba(99,102,241,0.12)', color: '#6366f1', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                                    {t.parcela_atual}/{t.total_parcelas}
                                  </span>
                                )}
                                {t.recorrente && (
                                  <span title="Recorrente" style={{ flexShrink: 0 }}>
                                    <RefreshCcw size={11} color="#f59e0b" />
                                  </span>
                                )}
                              </div>
                              {t.categoria && <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{t.categoria}</div>}
                            </td>
                            <td style={{ padding: '12px 14px', fontWeight: 700, color: t.tipo === 'entrada' ? '#10b981' : '#ef4444', whiteSpace: 'nowrap' }}>
                              {t.tipo === 'entrada' ? '+' : '−'} {fmtBRL(t.valor)}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: `${sb.color}18`, color: sb.color }}>{sb.label}</span>
                            </td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmtDate(t.data_vencimento)}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{fmtDate(t.data_pagamento)}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-2)', whiteSpace: 'nowrap' }}>{metodoLabel(t.metodo_pagamento)}</td>
                            <td style={{ padding: '12px 14px', color: 'var(--text-2)', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.projeto_nome ?? '—'}</td>
                            <td style={{ padding: '12px 14px' }}>
                              {t.nota_fiscal_emitida
                                ? <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: 12, fontWeight: 600 }}><FileCheck size={13} /> {t.numero_nota_fiscal ? `#${t.numero_nota_fiscal}` : 'Emitida'}</span>
                                : <span style={{ color: 'var(--text-3)', fontSize: 12 }}>—</span>}
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <div className="fin-action-btn" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                {canEdit && (
                                  <>
                                    <button title={t.status === 'pago' ? 'Marcar pendente' : 'Marcar pago'} onClick={() => toggleStatus(t)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: t.status === 'pago' ? '#f59e0b' : '#10b981', padding: 4, display: 'flex', alignItems: 'center' }}>
                                      <Check size={14} />
                                    </button>
                                    {!t.nota_fiscal_emitida && (
                                      <button title="Registrar NF" onClick={() => setNfModal({ id: t.id, numero: '' })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                                        <Receipt size={14} />
                                      </button>
                                    )}
                                    {isPai && (
                                      <button title="Editar parcelas restantes" onClick={() => setEditParcelasModal({ paiId: t.id, novoValor: String(t.valor) })}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', padding: 4, display: 'flex', alignItems: 'center' }}>
                                        <Layers size={14} />
                                      </button>
                                    )}
                                    <button title="Editar" onClick={() => openEdit(t)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4, display: 'flex', alignItems: 'center' }}>
                                      <Edit2 size={14} />
                                    </button>
                                    <button title="Excluir" onClick={() => handleDelete(t)}
                                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4, display: 'flex', alignItems: 'center' }}>
                                      <Trash2 size={14} />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── TAB: FLUXO DE CAIXA ───────────────────────────────────────────── */}
        {activeTab === 'fluxo' && (
          <>
            {/* Line chart */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 24, boxShadow: 'var(--shadow-card)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Projeção dos próximos 12 meses</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>Baseado em transações pendentes e recorrentes</div>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={fluxoData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--text-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    formatter={(value: any, name: any) => {
                      const labels: Record<string, string> = { entradas: 'Receitas', saidas: 'Despesas', saldo: 'Saldo Projetado' }
                      return [fmtBRL(Number(value)), labels[name] ?? name] as [string, string]
                    }}
                    contentStyle={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }}
                  />
                  <Legend formatter={(v: string) => ({ entradas: 'Receitas', saidas: 'Despesas', saldo: 'Saldo' }[v] ?? v)} wrapperStyle={{ fontSize: 12, color: 'var(--text-2)' }} />
                  <Line type="monotone" dataKey="entradas" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="saidas"   stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="saldo"    stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Alerts */}
            {fluxoData.some(m => m.saldo < 0) && (
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <TrendingDown size={18} color="#ef4444" style={{ marginTop: 1, flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Atenção — Saldo negativo previsto</div>
                  <div style={{ fontSize: 12, color: 'var(--text-2)' }}>
                    {fluxoData.filter(m => m.saldo < 0).map(m => `${m.label}: ${fmtBRL(m.saldo)}`).join(' · ')}
                  </div>
                </div>
              </div>
            )}

            {/* Monthly table */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Mês', 'Entradas Previstas', 'Saídas Previstas', 'Saldo Projetado'].map(h => (
                      <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fluxoData.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)', background: m.saldo < 0 ? 'rgba(239,68,68,0.04)' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text)' }}>{m.label}</td>
                      <td style={{ padding: '12px 16px', color: '#10b981', fontWeight: 600 }}>+ {fmtBRL(m.entradas)}</td>
                      <td style={{ padding: '12px 16px', color: '#ef4444', fontWeight: 600 }}>− {fmtBRL(m.saidas)}</td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: m.saldo >= 0 ? '#10b981' : '#ef4444' }}>{fmtBRL(m.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* ── Transaction Modal ────────────────────────────────────────────────── */}
      {modalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>
                {editingId ? 'Editar transação' : `Nova ${form.tipo === 'entrada' ? 'entrada' : 'saída'}`}
              </div>
              <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Tipo */}
              {!editingId && (
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <div style={{ display: 'flex', background: 'var(--bg-input)', borderRadius: 8, padding: 3, border: '1px solid var(--border-input)' }}>
                    {(['entrada', 'saida'] as const).map(t => (
                      <button key={t} onClick={() => setForm(f => ({ ...f, tipo: t, categoria: '' }))}
                        style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: form.tipo === t ? (t === 'entrada' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)') : 'transparent', color: form.tipo === t ? (t === 'entrada' ? '#10b981' : '#ef4444') : 'var(--text-3)', transition: 'all 0.15s' }}>
                        {t === 'entrada' ? '+ Entrada' : '− Saída'}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Descrição */}
              <div>
                <label style={labelStyle}>Descrição *</label>
                <input value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Ex: Honorários projeto residencial" style={inputStyle} />
              </div>

              {/* Valor */}
              <div>
                <label style={labelStyle}>Valor total (R$) *</label>
                <input value={form.valor} onChange={e => setForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" style={inputStyle} type="text" inputMode="decimal" />
              </div>

              {/* Parcelamento (apenas em nova transação) */}
              {!editingId && (
                <div style={{ background: 'var(--bg-input)', borderRadius: 10, padding: '14px 16px', border: '1px solid var(--border-input)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)', fontWeight: 500, marginBottom: form.parcelar ? 14 : 0 }}>
                    <input
                      type="checkbox"
                      checked={form.parcelar}
                      onChange={e => setForm(f => ({ ...f, parcelar: e.target.checked }))}
                      style={{ width: 15, height: 15, accentColor: 'var(--accent)' }}
                    />
                    Parcelar este lançamento
                  </label>
                  {form.parcelar && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                        <div>
                          <label style={labelStyle}>Nº de parcelas (2–60)</label>
                          <input
                            type="number" min={2} max={60}
                            value={form.num_parcelas}
                            onChange={e => setForm(f => ({ ...f, num_parcelas: e.target.value }))}
                            style={inputStyle}
                          />
                        </div>
                        <div>
                          <label style={labelStyle}>Primeira parcela vence em</label>
                          <input
                            type="date"
                            value={form.primeira_parcela}
                            onChange={e => setForm(f => ({ ...f, primeira_parcela: e.target.value }))}
                            style={inputStyle}
                          />
                        </div>
                      </div>
                      {parcelaValor > 0 && parseInt(form.num_parcelas) >= 2 && (
                        <div style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 12, color: '#6366f1', fontWeight: 600 }}>
                          {form.num_parcelas}× de {fmtBRL(parcelaValor)} = {fmtBRL(parseFloat(form.valor.replace(',', '.')))} total
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Categoria */}
              <div>
                <label style={labelStyle}>Categoria</label>
                <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))} style={inputStyle}>
                  <option value="">Selecionar...</option>
                  {cats.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Projeto + Cliente */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Projeto</label>
                  <select value={form.projeto_id} onChange={e => setForm(f => ({ ...f, projeto_id: e.target.value }))} style={inputStyle}>
                    <option value="">Nenhum</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Cliente</label>
                  <select value={form.cliente_id} onChange={e => setForm(f => ({ ...f, cliente_id: e.target.value }))} style={inputStyle}>
                    <option value="">Nenhum</option>
                    {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                  </select>
                </div>
              </div>

              {/* Método + Status */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Método de pagamento</label>
                  <select value={form.metodo_pagamento} onChange={e => setForm(f => ({ ...f, metodo_pagamento: e.target.value }))} style={inputStyle}>
                    <option value="">Selecionar...</option>
                    {METODOS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Status</label>
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={inputStyle}>
                    {STATUS_OPTS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Datas (apenas quando não parcelado, ou para edição) */}
              {(!form.parcelar || editingId) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={labelStyle}>Data de vencimento</label>
                    <input type="date" value={form.data_vencimento} onChange={e => setForm(f => ({ ...f, data_vencimento: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Data de pagamento</label>
                    <input type="date" value={form.data_pagamento} onChange={e => setForm(f => ({ ...f, data_pagamento: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
              )}

              {/* NF */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: 'var(--text-2)' }}>
                  <input type="checkbox" checked={form.nota_fiscal_emitida} onChange={e => setForm(f => ({ ...f, nota_fiscal_emitida: e.target.checked }))} style={{ width: 15, height: 15, accentColor: 'var(--accent)' }} />
                  Nota fiscal emitida
                </label>
                {form.nota_fiscal_emitida && (
                  <input value={form.numero_nota_fiscal} onChange={e => setForm(f => ({ ...f, numero_nota_fiscal: e.target.value }))} placeholder="Número da NF (opcional)" style={{ ...inputStyle, marginTop: 8 }} />
                )}
              </div>

              {/* Observação */}
              <div>
                <label style={labelStyle}>Observação</label>
                <textarea value={form.observacao} onChange={e => setForm(f => ({ ...f, observacao: e.target.value }))} placeholder="Observações..." rows={2} style={{ ...inputStyle, resize: 'vertical' as const }} />
              </div>
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setModalOpen(false)} style={{ padding: '9px 18px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
                Cancelar
              </button>
              <button onClick={handleSave} disabled={saving || !form.descricao || !form.valor}
                style={{ padding: '9px 20px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: saving || !form.descricao || !form.valor ? 0.5 : 1 }}>
                {saving ? 'Salvando...' : editingId ? 'Salvar alterações' : form.parcelar ? `Criar ${form.num_parcelas} parcelas` : 'Criar transação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Edit Parcelas Modal ───────────────────────────────────────────────── */}
      {editParcelasModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setEditParcelasModal(null) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 420, padding: 28, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Editar parcelas restantes</div>
              <button onClick={() => setEditParcelasModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><X size={18} /></button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.5 }}>
              Altera o valor de todas as parcelas pendentes desta série. Parcelas já pagas não serão afetadas.
            </p>
            <label style={labelStyle}>Novo valor por parcela (R$)</label>
            <input
              value={editParcelasModal.novoValor}
              onChange={e => setEditParcelasModal(x => x ? { ...x, novoValor: e.target.value } : x)}
              placeholder="0,00"
              style={inputStyle}
              type="text" inputMode="decimal"
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setEditParcelasModal(null)} style={{ padding: '9px 18px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={handleEditParcelasRestantes} disabled={savingParcelas}
                style={{ padding: '9px 20px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingParcelas ? 0.6 : 1 }}>
                {savingParcelas ? 'Salvando...' : 'Atualizar parcelas'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── NF Modal ─────────────────────────────────────────────────────────── */}
      {nfModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) setNfModal(null) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 14, padding: 24, width: 360, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Registrar nota fiscal</div>
            <input value={nfModal.numero} onChange={e => setNfModal(x => x ? { ...x, numero: e.target.value } : x)} placeholder="Número da NF (opcional)" style={inputStyle} />
            <div style={{ display: 'flex', gap: 10, marginTop: 16, justifyContent: 'flex-end' }}>
              <button onClick={() => setNfModal(null)} style={{ padding: '8px 16px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => saveNF(nfModal.id, nfModal.numero)} style={{ padding: '8px 16px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
