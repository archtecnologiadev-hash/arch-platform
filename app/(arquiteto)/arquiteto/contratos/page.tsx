'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Plus, Trash2, Copy, Edit2, Send, Eye, X, FileText,
  Download, ScrollText,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Modelo {
  id: string
  nome: string
  conteudo: string
  ativo: boolean
  created_at: string
  contratosCount?: number
}

interface Contrato {
  id: string
  titulo: string
  conteudo_final: string
  valor: number | null
  status: 'rascunho' | 'enviado' | 'visualizado' | 'assinado' | 'cancelado'
  enviado_em: string | null
  assinado_em: string | null
  assinatura_cliente: string | null
  assinatura_arquiteto: string | null
  cliente_id: string | null
  projeto_id: string | null
  modelo_id: string | null
  created_at: string
  projeto_nome?: string | null
  cliente_nome?: string | null
  cliente_email?: string | null
}

interface Projeto { id: string; nome: string; cliente_id: string | null; email_cliente: string | null }
interface Cliente { id: string; nome: string; email: string }

// ─── Constants ────────────────────────────────────────────────────────────────

const VARS = [
  { key: 'nome_cliente',      label: 'Nome do cliente' },
  { key: 'cpf_cliente',       label: 'CPF do cliente' },
  { key: 'nome_escritorio',   label: 'Nome do escritório' },
  { key: 'nome_arquiteto',    label: 'Nome do arquiteto' },
  { key: 'nome_projeto',      label: 'Nome do projeto' },
  { key: 'descricao_projeto', label: 'Descrição do projeto' },
  { key: 'valor_total',       label: 'Valor total' },
  { key: 'data_inicio',       label: 'Data de início' },
  { key: 'data_entrega',      label: 'Data de entrega' },
  { key: 'cidade',            label: 'Cidade' },
  { key: 'data_atual',        label: 'Data atual' },
]

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  rascunho:   { label: 'Rascunho',   color: '#8e8e93', bg: 'rgba(142,142,147,0.12)' },
  enviado:    { label: 'Enviado',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
  visualizado:{ label: 'Visualizado',color: '#007AFF', bg: 'rgba(0,122,255,0.12)' },
  assinado:   { label: 'Assinado',   color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
  cancelado:  { label: 'Cancelado',  color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
}

const DEFAULT_TEMPLATE = `<h2>CONTRATO DE PRESTAÇÃO DE SERVIÇOS DE ARQUITETURA</h2>

<p>Pelo presente instrumento particular, as partes abaixo qualificadas celebram o presente Contrato de Prestação de Serviços de Arquitetura:</p>

<h3>CONTRATANTE</h3>
<p><strong>Nome:</strong> {{nome_cliente}}</p>

<h3>CONTRATADA</h3>
<p><strong>Escritório:</strong> {{nome_escritorio}}<br><strong>Responsável:</strong> {{nome_arquiteto}}</p>

<h3>DO OBJETO</h3>
<p>O presente contrato tem por objeto a prestação de serviços de arquitetura para o projeto <strong>{{nome_projeto}}</strong>, consistindo em: {{descricao_projeto}}.</p>

<h3>DO PRAZO</h3>
<p>Os serviços serão iniciados em {{data_inicio}} e entregues até {{data_entrega}}.</p>

<h3>DO VALOR</h3>
<p>O valor total pelos serviços prestados é de <strong>{{valor_total}}</strong>, conforme cronograma acordado entre as partes.</p>

<h3>DAS OBRIGAÇÕES DA CONTRATADA</h3>
<ul>
  <li>Executar os serviços com qualidade técnica e criatividade;</li>
  <li>Manter sigilo sobre informações confidenciais do projeto;</li>
  <li>Apresentar os projetos nos prazos estipulados;</li>
  <li>Efetuar as revisões e ajustes necessários.</li>
</ul>

<h3>DAS OBRIGAÇÕES DO CONTRATANTE</h3>
<ul>
  <li>Fornecer informações necessárias para o desenvolvimento do projeto;</li>
  <li>Efetuar os pagamentos nos prazos estabelecidos;</li>
  <li>Respeitar os direitos autorais dos projetos desenvolvidos.</li>
</ul>

<h3>DA PROPRIEDADE INTELECTUAL</h3>
<p>Os projetos desenvolvidos são de propriedade intelectual da CONTRATADA, sendo vedada sua reprodução ou utilização sem autorização expressa.</p>

<h3>DO FORO</h3>
<p>As partes elegem o foro da Comarca de {{cidade}} para dirimir quaisquer controvérsias oriundas deste contrato.</p>

<p>{{cidade}}, {{data_atual}}.</p>`

const fmtBRL  = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
const fmtDate = (d: string | null) => d ? new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'

function substituir(content: string, dados: Record<string, string>): string {
  return VARS.reduce((s, v) => s.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), dados[v.key] ?? `{{${v.key}}}`), content)
}

// ─── Rich Text Editor ─────────────────────────────────────────────────────────

function RichEditor({ initialContent, onChange }: { initialContent: string; onChange: (html: string) => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const initialized = useRef(false)

  useEffect(() => {
    if (ref.current && !initialized.current) {
      ref.current.innerHTML = initialContent
      initialized.current = true
    }
  }, [initialContent])

  function exec(cmd: string, val?: string) {
    document.execCommand(cmd, false, val)
    ref.current?.focus()
    onChange(ref.current?.innerHTML ?? '')
  }

  function insertVar(key: string) {
    const sel = window.getSelection()
    const text = `{{${key}}}`
    if (sel?.rangeCount && ref.current?.contains(sel.getRangeAt(0).commonAncestorContainer)) {
      const range = sel.getRangeAt(0)
      const node = document.createTextNode(text)
      range.deleteContents()
      range.insertNode(node)
      range.setStartAfter(node)
      range.collapse(true)
      sel.removeAllRanges()
      sel.addRange(range)
    } else {
      ref.current!.innerHTML += text
    }
    onChange(ref.current?.innerHTML ?? '')
  }

  const toolBtn = (label: string, cmd: string, val?: string) => (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); exec(cmd, val) }}
      title={label}
      style={{ padding: '5px 8px', background: 'none', border: '1px solid var(--border-input)', borderRadius: 5, cursor: 'pointer', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', lineHeight: 1 }}
    >
      {label}
    </button>
  )

  return (
    <div style={{ display: 'flex', gap: 16, height: '100%' }}>
      {/* Editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Toolbar */}
        <div style={{ display: 'flex', gap: 4, padding: '8px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', background: 'var(--bg)' }}>
          {toolBtn('B', 'bold')}
          {toolBtn('I', 'italic')}
          {toolBtn('U', 'underline')}
          {toolBtn('H2', 'formatBlock', 'h2')}
          {toolBtn('H3', 'formatBlock', 'h3')}
          {toolBtn('¶', 'formatBlock', 'p')}
          {toolBtn('• Lista', 'insertUnorderedList')}
          {toolBtn('1. Lista', 'insertOrderedList')}
        </div>
        {/* Editable area */}
        <div
          ref={ref}
          contentEditable
          suppressContentEditableWarning
          onInput={() => onChange(ref.current?.innerHTML ?? '')}
          style={{
            flex: 1, padding: '16px 20px', outline: 'none', overflowY: 'auto',
            lineHeight: 1.7, fontSize: 14, color: 'var(--text)',
            background: 'var(--bg-card)',
          }}
          className="rich-editor-content"
        />
      </div>
      {/* Variables sidebar */}
      <div style={{ width: 176, flexShrink: 0, overflowY: 'auto' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10, padding: '0 2px' }}>Variáveis</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {VARS.map(v => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVar(v.key)}
              style={{
                textAlign: 'left', padding: '7px 10px', borderRadius: 7,
                background: 'var(--bg)', border: '1px solid var(--border)',
                cursor: 'pointer', fontSize: 11,
              }}
            >
              <div style={{ color: 'var(--accent)', fontWeight: 600, fontFamily: 'monospace' }}>{`{{${v.key}}}`}</div>
              <div style={{ color: 'var(--text-3)', marginTop: 2 }}>{v.label}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ContratosPage() {
  const [modelos, setModelos]         = useState<Modelo[]>([])
  const [contratos, setContratos]     = useState<Contrato[]>([])
  const [projetos, setProjetos]       = useState<Projeto[]>([])
  const [clientes, setClientes]       = useState<Cliente[]>([])
  const [escritorioId, setEscritorioId] = useState<string | null>(null)
  const [escritorioNome, setEscritorioNome] = useState('')
  const [arquitetoNome, setArquitetoNome]   = useState('')
  const [loading, setLoading]         = useState(true)
  const [nivelRank, setNivelRank]     = useState(2)

  const [tab, setTab] = useState<'modelos' | 'contratos'>('modelos')

  // Model editor state
  const [editorOpen, setEditorOpen]       = useState(false)
  const [editingModelo, setEditingModelo] = useState<Modelo | null>(null)
  const [modeloNome, setModeloNome]       = useState('')
  const [modeloContent, setModeloContent] = useState('')
  const [savingModelo, setSavingModelo]   = useState(false)

  // Contract create/view state
  const [contratoModal, setContratoModal] = useState<'create' | 'view' | null>(null)
  const [viewContrato, setViewContrato]   = useState<Contrato | null>(null)
  const [contratoForm, setContratoForm]   = useState({
    titulo: '', modelo_id: '', projeto_id: '', valor: '',
    data_inicio: '', data_entrega: '', cidade: '', observacoes: '',
    assinatura_arquiteto: '',
  })
  const [contratoPreview, setContratoPreview]   = useState('')
  const [savingContrato, setSavingContrato]     = useState(false)
  const [filterStatus, setFilterStatus]         = useState('')
  const [filterBusca, setFilterBusca]           = useState('')

  const canEdit = nivelRank >= 1

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const [{ data: ud }, { data: escData }] = await Promise.all([
      supabase.from('users').select('nome, nivel_permissao').eq('id', user.id).maybeSingle(),
      supabase.from('escritorios').select('id, nome').eq('user_id', user.id).maybeSingle(),
    ])

    const NIVEL_RANK: Record<string, number> = { operacional: 0, gestor: 1, owner: 2 }
    setNivelRank(NIVEL_RANK[ud?.nivel_permissao ?? 'owner'] ?? 2)
    setArquitetoNome(ud?.nome || user.email?.split('@')[0] || 'Arquiteto')

    let escId = escData?.id ?? null
    if (!escId) {
      const { data: linked } = await supabase.from('users').select('escritorio_vinculado_id').eq('id', user.id).maybeSingle()
      escId = linked?.escritorio_vinculado_id ?? null
      if (escId) {
        const { data: escInfo } = await supabase.from('escritorios').select('id, nome').eq('id', escId).maybeSingle()
        setEscritorioNome(escInfo?.nome ?? '')
      }
    } else {
      setEscritorioNome(escData?.nome ?? '')
    }

    if (!escId) { setLoading(false); return }
    setEscritorioId(escId)

    const [{ data: mdData }, { data: ctData }, { data: projData }, { data: clientData }] = await Promise.all([
      supabase.from('contrato_modelos').select('*').eq('escritorio_id', escId).order('created_at', { ascending: false }),
      supabase.from('contratos')
        .select('*, projetos(nome), users!contratos_cliente_id_fkey(nome, email)')
        .eq('escritorio_id', escId)
        .order('created_at', { ascending: false }),
      supabase.from('projetos').select('id, nome, cliente_id, email_cliente').eq('escritorio_id', escId).order('nome'),
      supabase.from('users').select('id, nome, email').not('escritorio_vinculado_id', 'is', null).limit(200),
    ])

    if (mdData) {
      const countMap: Record<string, number> = {}
      if (ctData) ctData.forEach((c: Record<string, unknown>) => { if (c.modelo_id) countMap[c.modelo_id as string] = (countMap[c.modelo_id as string] ?? 0) + 1 })
      setModelos(mdData.map((m: Record<string, unknown>) => ({ ...(m as unknown as Modelo), contratosCount: countMap[m.id as string] ?? 0 })))
    }
    if (ctData) {
      setContratos(ctData.map((c: Record<string, unknown>) => ({
        ...c,
        projeto_nome: (c.projetos as { nome: string } | null)?.nome ?? null,
        cliente_nome: (c['users!contratos_cliente_id_fkey'] as { nome: string; email: string } | null)?.nome ?? null,
        cliente_email: (c['users!contratos_cliente_id_fkey'] as { nome: string; email: string } | null)?.email ?? null,
      })) as Contrato[])
    }
    if (projData) setProjetos(projData as Projeto[])
    if (clientData) setClientes(clientData as Cliente[])
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  // ── Model CRUD ────────────────────────────────────────────────────────────

  function openNewModelo() {
    setEditingModelo(null)
    setModeloNome('Contrato de Prestação de Serviços de Arquitetura')
    setModeloContent(DEFAULT_TEMPLATE)
    setEditorOpen(true)
  }

  function openEditModelo(m: Modelo) {
    setEditingModelo(m)
    setModeloNome(m.nome)
    setModeloContent(m.conteudo)
    setEditorOpen(true)
  }

  async function saveModelo() {
    if (!escritorioId || !modeloNome.trim() || !modeloContent.trim()) return
    setSavingModelo(true)
    const supabase = createClient()
    const payload = { escritorio_id: escritorioId, nome: modeloNome, conteudo: modeloContent }
    if (editingModelo) {
      await supabase.from('contrato_modelos').update(payload).eq('id', editingModelo.id)
    } else {
      await supabase.from('contrato_modelos').insert(payload)
    }
    setSavingModelo(false)
    setEditorOpen(false)
    await load()
  }

  async function duplicarModelo(m: Modelo) {
    if (!escritorioId) return
    const supabase = createClient()
    await supabase.from('contrato_modelos').insert({ escritorio_id: escritorioId, nome: m.nome + ' (cópia)', conteudo: m.conteudo })
    await load()
  }

  async function deleteModelo(id: string) {
    if (!confirm('Excluir este modelo?')) return
    const supabase = createClient()
    await supabase.from('contrato_modelos').delete().eq('id', id)
    setModelos(prev => prev.filter(m => m.id !== id))
  }

  // ── Contract CRUD ─────────────────────────────────────────────────────────

  function buildPreview() {
    const modelo = modelos.find(m => m.id === contratoForm.modelo_id)
    if (!modelo) return setContratoPreview('')
    const proj = projetos.find(p => p.id === contratoForm.projeto_id)
    const cliente = proj?.cliente_id ? clientes.find(c => c.id === proj.cliente_id) : null
    const dados: Record<string, string> = {
      nome_cliente:      cliente?.nome ?? proj?.cliente_id ?? '{{nome_cliente}}',
      cpf_cliente:       '{{cpf_cliente}}',
      nome_escritorio:   escritorioNome,
      nome_arquiteto:    arquitetoNome,
      nome_projeto:      proj?.nome ?? '{{nome_projeto}}',
      descricao_projeto: '{{descricao_projeto}}',
      valor_total:       contratoForm.valor ? fmtBRL(parseFloat(contratoForm.valor)) : '{{valor_total}}',
      data_inicio:       contratoForm.data_inicio ? new Date(contratoForm.data_inicio + 'T12:00:00').toLocaleDateString('pt-BR') : '{{data_inicio}}',
      data_entrega:      contratoForm.data_entrega ? new Date(contratoForm.data_entrega + 'T12:00:00').toLocaleDateString('pt-BR') : '{{data_entrega}}',
      cidade:            contratoForm.cidade || '{{cidade}}',
      data_atual:        new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' }),
    }
    setContratoPreview(substituir(modelo.conteudo, dados))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { buildPreview() }, [contratoForm.modelo_id, contratoForm.projeto_id, contratoForm.valor, contratoForm.data_inicio, contratoForm.data_entrega, contratoForm.cidade])

  async function saveContrato(acao: 'rascunho' | 'enviar') {
    if (!escritorioId || !contratoForm.titulo || !contratoPreview) return
    setSavingContrato(true)
    const supabase = createClient()

    const proj = projetos.find(p => p.id === contratoForm.projeto_id)
    const cliente = proj?.cliente_id ? clientes.find(c => c.id === proj.cliente_id) : null
    const clienteEmail = cliente?.email ?? proj?.email_cliente ?? null

    const payload = {
      escritorio_id: escritorioId,
      titulo: contratoForm.titulo,
      conteudo_final: contratoPreview,
      modelo_id: contratoForm.modelo_id || null,
      projeto_id: contratoForm.projeto_id || null,
      cliente_id: proj?.cliente_id || null,
      valor: contratoForm.valor ? parseFloat(contratoForm.valor) : null,
      status: acao === 'enviar' ? 'enviado' : 'rascunho',
      enviado_em: acao === 'enviar' ? new Date().toISOString() : null,
      assinatura_arquiteto: contratoForm.assinatura_arquiteto || null,
    }

    const { data: created } = await supabase.from('contratos').insert(payload).select('id').single()

    if (acao === 'enviar' && clienteEmail && created) {
      const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.usearc.com.br'}/cliente/projeto/${proj?.id}?tab=contratos`
      await fetch('/api/notifications/contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'enviado', email: clienteEmail,
          nomeCliente: cliente?.nome ?? 'Cliente',
          nomeEscritorio: escritorioNome,
          tituloProjeto: proj?.nome ?? '',
          tituloContrato: contratoForm.titulo,
          linkContrato: link,
        }),
      }).catch(() => {})
    }

    setSavingContrato(false)
    setContratoModal(null)
    setContratoForm({ titulo: '', modelo_id: '', projeto_id: '', valor: '', data_inicio: '', data_entrega: '', cidade: '', observacoes: '', assinatura_arquiteto: '' })
    await load()
  }

  async function handleEnviar(c: Contrato) {
    const supabase = createClient()
    await supabase.from('contratos').update({ status: 'enviado', enviado_em: new Date().toISOString() }).eq('id', c.id)
    const proj = projetos.find(p => p.id === c.projeto_id)
    const clienteEmail = c.cliente_email ?? proj?.email_cliente ?? null
    if (clienteEmail) {
      const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.usearc.com.br'}/cliente/projeto/${c.projeto_id}?tab=contratos`
      await fetch('/api/notifications/contrato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'enviado', email: clienteEmail,
          nomeCliente: c.cliente_nome ?? 'Cliente', nomeEscritorio: escritorioNome,
          tituloProjeto: c.projeto_nome ?? '', tituloContrato: c.titulo,
          linkContrato: link,
        }),
      }).catch(() => {})
    }
    await load()
  }

  async function handleCancelar(id: string) {
    if (!confirm('Cancelar este contrato?')) return
    const supabase = createClient()
    await supabase.from('contratos').update({ status: 'cancelado' }).eq('id', id)
    setContratos(prev => prev.map(c => c.id === id ? { ...c, status: 'cancelado' } : c))
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este contrato?')) return
    const supabase = createClient()
    await supabase.from('contratos').delete().eq('id', id)
    setContratos(prev => prev.filter(c => c.id !== id))
  }

  // ── PDF ───────────────────────────────────────────────────────────────────

  function openPDF(c: Contrato) {
    const win = window.open('', '_blank')
    if (!win) return
    const assinadoInfo = c.assinado_em
      ? `<p style="margin:0;font-size:12px;color:#3a3a3c;">Assinado por: <strong>${c.assinatura_cliente ?? ''}</strong><br>Data: ${new Date(c.assinado_em).toLocaleString('pt-BR')}</p>`
      : ''
    const arquitetoInfo = c.assinatura_arquiteto
      ? `<p style="margin:0;font-size:12px;color:#3a3a3c;">Assinado por: <strong>${c.assinatura_arquiteto}</strong></p>`
      : ''
    win.document.write(`<!DOCTYPE html><html lang="pt-BR"><head>
      <meta charset="utf-8"><title>${c.titulo}</title>
      <style>
        body{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:40px;color:#1a1a1a;font-size:14px;line-height:1.7;}
        h2{font-size:18px;margin-bottom:8px;} h3{font-size:14px;margin:20px 0 6px;}
        ul{margin:8px 0;padding-left:20px;} li{margin-bottom:4px;}
        .sigs{margin-top:60px;display:flex;gap:40px;page-break-inside:avoid;}
        .sig-box{flex:1;border-top:2px solid #1a1a1a;padding-top:12px;}
        .sig-label{font-size:11px;color:#8e8e93;margin-top:4px;}
        .footer{margin-top:40px;font-size:10px;color:#8e8e93;border-top:1px solid #e5e5ea;padding-top:16px;}
        @media print{body{padding:20px;}}
      </style>
    </head><body>
      ${c.conteudo_final}
      <div class="sigs">
        <div class="sig-box">${arquitetoInfo || '<p style="height:48px;margin:0"></p>'}<p class="sig-label">Contratada — ${escritorioNome}</p></div>
        <div class="sig-box">${assinadoInfo || '<p style="height:48px;margin:0"></p>'}<p class="sig-label">Contratante — ${c.cliente_nome ?? ''}</p></div>
      </div>
      <div class="footer">
        Contrato ARC Platform · ID: ${c.id}<br>
        Gerado em ${new Date().toLocaleString('pt-BR')}
      </div>
    </body></html>`)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  const filteredContratos = contratos.filter(c => {
    if (filterStatus && c.status !== filterStatus) return false
    if (filterBusca && !c.titulo.toLowerCase().includes(filterBusca.toLowerCase()) && !(c.cliente_nome ?? '').toLowerCase().includes(filterBusca.toLowerCase())) return false
    return true
  })

  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 8,
    border: '1px solid var(--border-input)', background: 'var(--bg-input)',
    color: 'var(--text)', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  }
  const labelStyle: React.CSSProperties = {
    fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.05em',
    textTransform: 'uppercase', marginBottom: 5, display: 'block',
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ color: 'var(--text-3)', fontSize: 14 }}>Carregando...</span>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)' }}>
      <style>{`
        .rich-editor-content h2{font-size:17px;font-weight:700;margin:20px 0 8px;color:var(--text);}
        .rich-editor-content h3{font-size:14px;font-weight:700;margin:16px 0 6px;color:var(--text);}
        .rich-editor-content p{margin:0 0 12px;} .rich-editor-content ul,.rich-editor-content ol{margin:8px 0 12px;padding-left:22px;}
        .rich-editor-content li{margin-bottom:4px;}
        .contrato-preview h2{font-size:17px;font-weight:700;margin:20px 0 8px;}
        .contrato-preview h3{font-size:14px;font-weight:700;margin:16px 0 6px;}
        .contrato-preview p{margin:0 0 12px;} .contrato-preview ul,.contrato-preview ol{margin:8px 0 12px;padding-left:22px;}
        .contrato-preview li{margin-bottom:4px;}
      `}</style>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="sticky-page-header" style={{
        padding: '0 32px', height: 70, borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 30,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Módulo</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>Contratos</div>
        </div>
        {canEdit && (
          <div style={{ display: 'flex', gap: 10 }}>
            {tab === 'modelos' && (
              <button onClick={openNewModelo} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--btn-bg)', border: 'none', borderRadius: 8, fontSize: 13, color: 'var(--btn-text)', cursor: 'pointer', fontWeight: 600 }}>
                <Plus size={14} /> Novo modelo
              </button>
            )}
            {tab === 'contratos' && (
              <button onClick={() => { setContratoModal('create'); setContratoForm({ titulo: '', modelo_id: modelos[0]?.id ?? '', projeto_id: '', valor: '', data_inicio: '', data_entrega: '', cidade: '', observacoes: '', assinatura_arquiteto: arquitetoNome }) }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', background: 'var(--btn-bg)', border: 'none', borderRadius: 8, fontSize: 13, color: 'var(--btn-text)', cursor: 'pointer', fontWeight: 600 }}>
                <Plus size={14} /> Novo contrato
              </button>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '24px 32px' }}>

        {/* ── Tabs ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'var(--bg-input)', borderRadius: 10, padding: 4, width: 'fit-content', border: '1px solid var(--border)' }}>
          {([['modelos', 'Modelos', ScrollText], ['contratos', 'Contratos', FileText]] as const).map(([id, label, Icon]) => (
            <button key={id} onClick={() => setTab(id)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 18px',
              borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: tab === id ? 600 : 400,
              background: tab === id ? 'var(--bg-card)' : 'transparent',
              color: tab === id ? 'var(--text)' : 'var(--text-3)',
              boxShadow: tab === id ? 'var(--shadow-card)' : 'none',
            }}>
              <Icon size={14} />
              {label}
              {id === 'contratos' && contratos.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--accent-soft)', color: 'var(--accent)', padding: '1px 6px', borderRadius: 10 }}>{contratos.length}</span>
              )}
            </button>
          ))}
        </div>

        {/* ── Modelos Tab ────────────────────────────────────────────────── */}
        {tab === 'modelos' && (
          <div>
            {modelos.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <ScrollText size={36} color="#c7c7cc" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Nenhum modelo criado</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20 }}>Crie um modelo de contrato reutilizável para seus projetos.</div>
                {canEdit && (
                  <button onClick={openNewModelo} style={{ padding: '10px 24px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Criar primeiro modelo
                  </button>
                )}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
                {modelos.map(m => (
                  <div key={m.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ScrollText size={16} color="var(--accent)" />
                        </div>
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{m.nome}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
                            Criado {fmtDate(m.created_at)} · {m.contratosCount ?? 0} contrato{m.contratosCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                    </div>
                    {canEdit && (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => openEditModelo(m)} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer', fontWeight: 500 }}>
                          <Edit2 size={12} /> Editar
                        </button>
                        <button onClick={() => duplicarModelo(m)} title="Duplicar" style={{ padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center' }}>
                          <Copy size={13} />
                        </button>
                        <button onClick={() => deleteModelo(m.id)} title="Excluir" style={{ padding: '7px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Contratos Tab ──────────────────────────────────────────────── */}
        {tab === 'contratos' && (
          <div>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <input value={filterBusca} onChange={e => setFilterBusca(e.target.value)} placeholder="Buscar contrato ou cliente..." style={{ ...inputStyle, width: 260, flex: 'none' }} />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 'auto', flex: 'none' }}>
                <option value="">Todos os status</option>
                {Object.entries(STATUS_META).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
              </select>
              {(filterBusca || filterStatus) && (
                <button onClick={() => { setFilterBusca(''); setFilterStatus('') }} style={{ ...inputStyle, width: 'auto', cursor: 'pointer', color: 'var(--text-3)' }}>Limpar</button>
              )}
            </div>

            {filteredContratos.length === 0 ? (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '60px 24px', textAlign: 'center', boxShadow: 'var(--shadow-card)' }}>
                <FileText size={36} color="#c7c7cc" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 6 }}>Nenhum contrato encontrado</div>
                <div style={{ fontSize: 13, color: 'var(--text-3)' }}>Crie um novo contrato usando um dos seus modelos.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredContratos.map(c => {
                  const sm = STATUS_META[c.status] ?? STATUS_META.rascunho
                  return (
                    <div key={c.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, padding: '16px 20px', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 9, background: sm.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FileText size={16} color={sm.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.titulo}</div>
                        <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>
                          {c.cliente_nome ?? '—'} · {c.projeto_nome ?? 'Sem projeto'}
                          {c.valor ? ` · ${fmtBRL(c.valor)}` : ''}
                          · {fmtDate(c.created_at)}
                        </div>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '4px 10px', borderRadius: 20, background: sm.bg, color: sm.color, whiteSpace: 'nowrap' }}>{sm.label}</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setViewContrato(c); setContratoModal('view') }} title="Ver" style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openPDF(c)} title="Imprimir / PDF" style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: 'var(--text-2)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12 }}>
                          <Download size={13} />
                        </button>
                        {canEdit && c.status === 'rascunho' && (
                          <button onClick={() => handleEnviar(c)} title="Enviar ao cliente" style={{ padding: '6px 12px', background: 'rgba(0,122,255,0.09)', border: '1px solid rgba(0,122,255,0.25)', borderRadius: 7, cursor: 'pointer', color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 600 }}>
                            <Send size={13} /> Enviar
                          </button>
                        )}
                        {canEdit && c.status !== 'cancelado' && c.status !== 'assinado' && (
                          <button onClick={() => handleCancelar(c.id)} title="Cancelar" style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', fontSize: 12 }}>
                            <X size={13} />
                          </button>
                        )}
                        {canEdit && (c.status === 'rascunho' || c.status === 'cancelado') && (
                          <button onClick={() => handleDelete(c.id)} title="Excluir" style={{ padding: '6px 10px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 7, cursor: 'pointer', color: '#ef4444', display: 'flex', alignItems: 'center', fontSize: 12 }}>
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Model Editor Overlay ───────────────────────────────────────────────── */}
      {editorOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--bg)', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
          {/* Editor header */}
          <div style={{ height: 60, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: 'var(--bg-card)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button onClick={() => setEditorOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', display: 'flex', alignItems: 'center', padding: 4 }}>
                <X size={20} />
              </button>
              <input
                value={modeloNome}
                onChange={e => setModeloNome(e.target.value)}
                style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', background: 'none', border: 'none', outline: 'none', width: 360 }}
                placeholder="Nome do modelo..."
              />
            </div>
            <button onClick={saveModelo} disabled={savingModelo || !modeloNome.trim()} style={{ padding: '9px 20px', background: 'var(--btn-bg)', color: 'var(--btn-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: savingModelo || !modeloNome.trim() ? 0.5 : 1 }}>
              {savingModelo ? 'Salvando...' : 'Salvar modelo'}
            </button>
          </div>
          {/* Editor body */}
          <div style={{ flex: 1, overflow: 'hidden', border: '1px solid var(--border)' }}>
            <RichEditor
              key={editingModelo?.id ?? 'new'}
              initialContent={modeloContent}
              onChange={setModeloContent}
            />
          </div>
        </div>
      )}

      {/* ── Create Contract Modal ──────────────────────────────────────────────── */}
      {contratoModal === 'create' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', padding: 16, backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setContratoModal(null) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 1000, margin: 'auto', maxHeight: '92vh', overflow: 'hidden', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Novo contrato</div>
              <button onClick={() => setContratoModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={20} /></button>
            </div>
            <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
              {/* Left: form */}
              <div style={{ width: 340, flexShrink: 0, overflowY: 'auto', padding: '20px', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={labelStyle}>Título *</label>
                  <input value={contratoForm.titulo} onChange={e => setContratoForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex: Contrato Projeto Residencial" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Modelo</label>
                  <select value={contratoForm.modelo_id} onChange={e => setContratoForm(f => ({ ...f, modelo_id: e.target.value }))} style={inputStyle}>
                    <option value="">Sem modelo</option>
                    {modelos.map(m => <option key={m.id} value={m.id}>{m.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Projeto</label>
                  <select value={contratoForm.projeto_id} onChange={e => setContratoForm(f => ({ ...f, projeto_id: e.target.value }))} style={inputStyle}>
                    <option value="">Selecionar projeto...</option>
                    {projetos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Valor total (R$)</label>
                  <input value={contratoForm.valor} onChange={e => setContratoForm(f => ({ ...f, valor: e.target.value }))} placeholder="0,00" style={inputStyle} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={labelStyle}>Data início</label>
                    <input type="date" value={contratoForm.data_inicio} onChange={e => setContratoForm(f => ({ ...f, data_inicio: e.target.value }))} style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>Data entrega</label>
                    <input type="date" value={contratoForm.data_entrega} onChange={e => setContratoForm(f => ({ ...f, data_entrega: e.target.value }))} style={inputStyle} />
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Cidade</label>
                  <input value={contratoForm.cidade} onChange={e => setContratoForm(f => ({ ...f, cidade: e.target.value }))} placeholder="São Paulo" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Assinatura do arquiteto</label>
                  <input value={contratoForm.assinatura_arquiteto} onChange={e => setContratoForm(f => ({ ...f, assinatura_arquiteto: e.target.value }))} placeholder="Nome completo" style={inputStyle} />
                </div>
              </div>
              {/* Right: preview */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>Pré-visualização</div>
                {contratoPreview
                  ? <div className="contrato-preview" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: contratoPreview }} />
                  : <div style={{ color: 'var(--text-3)', fontSize: 13 }}>Selecione um modelo para ver a pré-visualização.</div>}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', gap: 10, justifyContent: 'flex-end', flexShrink: 0 }}>
              <button onClick={() => setContratoModal(null)} style={{ padding: '9px 18px', background: 'var(--bg-input)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text-2)', cursor: 'pointer' }}>
                Cancelar
              </button>
              <button onClick={() => saveContrato('rascunho')} disabled={savingContrato || !contratoForm.titulo} style={{ padding: '9px 18px', background: 'var(--bg)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 13, color: 'var(--text)', cursor: 'pointer', opacity: !contratoForm.titulo ? 0.5 : 1 }}>
                Salvar rascunho
              </button>
              <button onClick={() => saveContrato('enviar')} disabled={savingContrato || !contratoForm.titulo || !contratoPreview} style={{ padding: '9px 20px', background: 'var(--accent)', color: 'var(--accent-text)', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: !contratoForm.titulo || !contratoPreview ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Send size={14} /> Enviar ao cliente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── View Contract Modal ────────────────────────────────────────────────── */}
      {contratoModal === 'view' && viewContrato && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 100, display: 'flex', padding: 16, backdropFilter: 'blur(4px)' }} onClick={e => { if (e.target === e.currentTarget) setContratoModal(null) }}>
          <div style={{ background: 'var(--bg-card)', borderRadius: 16, width: '100%', maxWidth: 800, margin: 'auto', maxHeight: '92vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{viewContrato.titulo}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 20, background: STATUS_META[viewContrato.status]?.bg, color: STATUS_META[viewContrato.status]?.color }}>
                    {STATUS_META[viewContrato.status]?.label}
                  </span>
                  {viewContrato.cliente_nome && <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{viewContrato.cliente_nome}</span>}
                  {viewContrato.assinado_em && <span style={{ fontSize: 12, color: '#10b981' }}>Assinado em {fmtDate(viewContrato.assinado_em)}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => openPDF(viewContrato)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: 'var(--bg)', border: '1px solid var(--border-input)', borderRadius: 8, fontSize: 12, color: 'var(--text-2)', cursor: 'pointer' }}>
                  <Download size={13} /> PDF
                </button>
                <button onClick={() => setContratoModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}><X size={20} /></button>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px' }}>
              <div className="contrato-preview" style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--text)' }} dangerouslySetInnerHTML={{ __html: viewContrato.conteudo_final }} />
              {viewContrato.assinatura_cliente && (
                <div style={{ marginTop: 40, paddingTop: 24, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                  <div>
                    <div style={{ borderTop: '2px solid var(--text)', paddingTop: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{viewContrato.assinatura_arquiteto ?? escritorioNome}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Contratada</div>
                    </div>
                  </div>
                  <div>
                    <div style={{ borderTop: '2px solid var(--text)', paddingTop: 10 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{viewContrato.assinatura_cliente}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>Contratante · {fmtDate(viewContrato.assinado_em)}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
