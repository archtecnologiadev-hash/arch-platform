'use client'

import { useState, useEffect, useRef } from 'react'
import { Plus, Trash2, Loader2, Package, X, CheckCircle2, Upload, ImageIcon } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { usePlan } from '@/hooks/usePlan'

// ─── Types ────────────────────────────────────────────────────────────────────

interface ProdutoImagem {
  id: string
  url: string
  ordem: number
}

interface Produto {
  id: string
  nome: string
  descricao: string | null
  tipo: string
  imagens: ProdutoImagem[]
}

type TipoFilter = 'todos' | 'produto' | 'serviço' | 'portfólio'

const TIPO_OPTS: Array<{ value: string; label: string }> = [
  { value: 'produto',   label: 'Produto' },
  { value: 'serviço',   label: 'Serviço' },
  { value: 'portfólio', label: 'Portfólio' },
]

const TIPO_META: Record<string, { color: string; bg: string; border: string }> = {
  'produto':   { color: '#007AFF', bg: 'rgba(0,122,255,0.08)',   border: 'rgba(0,122,255,0.2)' },
  'serviço':   { color: '#34d399', bg: 'rgba(52,211,153,0.1)',   border: 'rgba(52,211,153,0.22)' },
  'portfólio': { color: '#a78bfa', bg: 'rgba(167,139,250,0.1)',  border: 'rgba(167,139,250,0.22)' },
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CatalogoPage() {
  const planInfo = usePlan()
  const [loading, setLoading] = useState(true)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fornecedorId, setFornecedorId] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [filter, setFilter] = useState<TipoFilter>('todos')

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ nome: '', descricao: '', tipo: 'produto' })
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data: forn } = await supabase
        .from('fornecedores').select('id').eq('user_id', user.id).single()
      if (!forn) { setLoading(false); return }
      setFornecedorId(forn.id)

      await fetchProdutos(forn.id)
      setLoading(false)
    }
    load()
  }, [])

  async function fetchProdutos(fid: string) {
    const supabase = createClient()
    const { data } = await supabase
      .from('fornecedor_produtos')
      .select('id, nome, descricao, tipo, fornecedor_produto_imagens(id, url, ordem)')
      .eq('fornecedor_id', fid)
      .order('created_at', { ascending: false })
    if (data) {
      setProdutos(data.map((p: Record<string, unknown>) => ({
        id: p.id as string,
        nome: p.nome as string,
        descricao: p.descricao as string | null,
        tipo: (p.tipo as string) ?? 'produto',
        imagens: ((p.fornecedor_produto_imagens as ProdutoImagem[]) ?? [])
          .sort((a, b) => a.ordem - b.ordem),
      })))
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? [])
    setFiles(prev => [...prev, ...selected])
    selected.forEach(f => {
      const reader = new FileReader()
      reader.onload = ev => setPreviews(prev => [...prev, ev.target?.result as string])
      reader.readAsDataURL(f)
    })
    e.target.value = ''
  }

  function removeFile(index: number) {
    setFiles(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  const limiteAtingido = planInfo.maxProdutos !== null && produtos.length >= planInfo.maxProdutos

  function openModal() {
    if (limiteAtingido) return
    setForm({ nome: '', descricao: '', tipo: 'produto' })
    setFiles([])
    setPreviews([])
    setSaved(false)
    setModalOpen(true)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!fornecedorId || !userId) return
    setSaving(true)
    const supabase = createClient()

    if (planInfo.maxProdutos !== null && produtos.length >= planInfo.maxProdutos) {
      setSaving(false)
      setModalOpen(false)
      return
    }

    const { data: prod, error: prodErr } = await supabase
      .from('fornecedor_produtos')
      .insert({ fornecedor_id: fornecedorId, nome: form.nome.trim(), descricao: form.descricao.trim() || null, tipo: form.tipo })
      .select('id').single()

    if (prodErr || !prod) { setSaving(false); return }

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
      const path = `${userId}/catalog/${prod.id}/${Date.now()}_${safeName}`
      const { error: upErr } = await supabase.storage.from('fornecedores').upload(path, file, { upsert: false })
      if (!upErr) {
        const { data: { publicUrl } } = supabase.storage.from('fornecedores').getPublicUrl(path)
        await supabase.from('fornecedor_produto_imagens').insert({ produto_id: prod.id, url: publicUrl, ordem: i, tamanho: file.size })
      }
    }

    if (fornecedorId) await fetchProdutos(fornecedorId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => { setModalOpen(false); setSaved(false) }, 1600)
  }

  async function handleDelete(produtoId: string) {
    setDeletingId(produtoId)
    const supabase = createClient()
    await supabase.from('fornecedor_produtos').delete().eq('id', produtoId)
    setProdutos(prev => prev.filter(p => p.id !== produtoId))
    setDeletingId(null)
  }

  const filtered = filter === 'todos' ? produtos : produtos.filter(p => p.tipo === filter)
  const meta = (tipo: string) => TIPO_META[tipo] ?? TIPO_META['produto']

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1a1a1a', background: '#f2f2f7' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .cat-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:14px; overflow:hidden; box-shadow:0 1px 3px rgba(0,0,0,0.08); transition:box-shadow 0.18s; }
        .cat-card:hover { box-shadow:0 4px 12px rgba(0,0,0,0.1); }
        .cat-filter-btn { padding:6px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; transition:all 0.15s; }
        .cat-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.08); border-radius:10px; padding:10px 14px; color:#1a1a1a; font-size:13px; outline:none; transition:border-color 0.15s; box-sizing:border-box; font-family:inherit; }
        .cat-inp:focus { border-color:rgba(0,122,255,0.4); }
        @keyframes cat-in { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .cat-modal-box { animation:cat-in 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1a1a1a', margin: 0 }}>Catálogo</h1>
          <p style={{ fontSize: 13, color: '#6b6b6b', margin: '5px 0 0' }}>
            Gerencie produtos, serviços e portfólio · {produtos.length} item{produtos.length !== 1 ? 's' : ''}
          </p>
        </div>
        {fornecedorId && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
            <button onClick={openModal} disabled={limiteAtingido} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 10, background: limiteAtingido ? 'rgba(0,0,0,0.1)' : '#007AFF', border: 'none', color: limiteAtingido ? '#8e8e93' : '#fff', fontSize: 13, fontWeight: 700, cursor: limiteAtingido ? 'not-allowed' : 'pointer' }}>
              <Plus size={14} /> Adicionar Item
            </button>
            {limiteAtingido && (
              <span style={{ fontSize: 11, color: '#f97316' }}>
                Limite de {planInfo.maxProdutos} itens atingido · <a href="/fornecedor/planos" style={{ color: '#007AFF', textDecoration: 'none', fontWeight: 600 }}>Fazer upgrade</a>
              </span>
            )}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
        {(['todos', 'produto', 'serviço', 'portfólio'] as TipoFilter[]).map(f => {
          const isActive = filter === f
          const m = f !== 'todos' ? meta(f) : null
          return (
            <button key={f} onClick={() => setFilter(f)} className="cat-filter-btn"
              style={{
                background: isActive ? (m ? m.bg : 'rgba(0,122,255,0.1)') : '#fff',
                border: isActive ? `1px solid ${m ? m.border : 'rgba(0,122,255,0.25)'}` : '1px solid rgba(0,0,0,0.1)',
                color: isActive ? (m ? m.color : '#007AFF') : '#6b6b6b',
                textTransform: 'capitalize' as const,
              }}>
              {f === 'todos' ? 'Todos' : f.charAt(0).toUpperCase() + f.slice(1)}
              {f !== 'todos' && <span style={{ marginLeft: 5, opacity: 0.7 }}>({produtos.filter(p => p.tipo === f).length})</span>}
            </button>
          )
        })}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8e8e93', fontSize: 14 }}>
          {produtos.length === 0
            ? 'Nenhum item no catálogo. Clique em "Adicionar Item" para começar.'
            : 'Nenhum item com esse tipo.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
          {filtered.map(prod => {
            const firstImg = prod.imagens[0]?.url
            const m = meta(prod.tipo)
            const isDeleting = deletingId === prod.id
            return (
              <div key={prod.id} className="cat-card">
                {firstImg
                  ? <img src={firstImg} alt={prod.nome} style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }} />
                  : <div style={{ width: '100%', height: 180, background: 'linear-gradient(135deg, #e8e8f0, #d4d4dc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={32} color="#c7c7cc" /></div>}
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a', flex: 1, marginRight: 8 }}>{prod.nome}</div>
                    <div style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 20, background: m.bg, border: `1px solid ${m.border}`, color: m.color, fontWeight: 700, flexShrink: 0 }}>
                      {prod.tipo.charAt(0).toUpperCase() + prod.tipo.slice(1)}
                    </div>
                  </div>
                  {prod.descricao && <p style={{ fontSize: 12.5, color: '#6b6b6b', lineHeight: 1.55, margin: '0 0 12px' }}>{prod.descricao}</p>}
                  {prod.imagens.length > 1 && (
                    <div style={{ fontSize: 11, color: '#8e8e93', marginBottom: 10 }}>
                      <ImageIcon size={10} style={{ display: 'inline', marginRight: 4 }} />{prod.imagens.length} imagens
                    </div>
                  )}
                  <button onClick={() => handleDelete(prod.id)} disabled={isDeleting}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11.5, padding: '6px 12px', borderRadius: 7, background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', cursor: isDeleting ? 'not-allowed' : 'pointer', fontWeight: 600, opacity: isDeleting ? 0.6 : 1 }}>
                    {isDeleting ? <Loader2 size={11} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={11} />}
                    {isDeleting ? 'Removendo...' : 'Remover'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add Modal */}
      {modalOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setModalOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(5px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="cat-modal-box"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, width: '100%', maxWidth: 500, padding: 28, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', maxHeight: '90vh', overflowY: 'auto' as const }}>
            {saved ? (
              <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
                <CheckCircle2 size={50} color="#34d399" style={{ marginBottom: 14 }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Item adicionado!</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>Adicionar ao Catálogo</div>
                  <button onClick={() => setModalOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
                </div>
                <input ref={fileInputRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Nome *</label>
                    <input className="cat-inp" required placeholder="Ex: Cozinha planejada, Elétrica residencial..." value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Descrição</label>
                    <textarea className="cat-inp" rows={3} placeholder="Descreva o produto ou serviço..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Tipo *</label>
                    <select className="cat-inp" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                      {TIPO_OPTS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Imagens</label>
                    <div onClick={() => fileInputRef.current?.click()} style={{ padding: '14px 16px', background: '#f2f2f7', border: '2px dashed rgba(0,0,0,0.15)', borderRadius: 8, fontSize: 12.5, color: '#8e8e93', cursor: 'pointer', textAlign: 'center' as const, marginBottom: previews.length > 0 ? 10 : 0 }}>
                      <Upload size={16} style={{ display: 'inline', marginRight: 6 }} />
                      Clique para selecionar imagens
                    </div>
                    {previews.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                        {previews.map((src, i) => (
                          <div key={i} style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', aspectRatio: '1/1' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            <button type="button" onClick={() => removeFile(i)}
                              style={{ position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                              <X size={10} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button type="submit" disabled={saving}
                    style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 13, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: saving ? 0.7 : 1 }}>
                    {saving ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : <><Plus size={13} /> Adicionar ao Catálogo</>}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
