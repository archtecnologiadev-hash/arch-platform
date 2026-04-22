'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { MapPin, ExternalLink, Send, X, CheckCircle2, Heart, Package, Loader2, Upload, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierCard {
  id: string
  slug: string
  name: string
  segment: string | null
  city: string | null
  bio: string | null
  image_url: string | null
  cover_url: string | null
}

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#4f9cf9', Elétrica: '#34d399', Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316', Pintura: '#ef4444', Iluminação: '#007AFF', Outro: '#6b6b6b',
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ArquitetoFornecedoresPage() {
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState<SupplierCard[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [segFilter, setSegFilter] = useState('Todos')
  const [segments, setSegments] = useState<string[]>(['Todos'])

  const [quoteTarget, setQuoteTarget] = useState<SupplierCard | null>(null)
  const [form, setForm] = useState({ descricao: '' })
  const [quoteFile, setQuoteFile] = useState<File | null>(null)
  const quoteFileRef = useRef<HTMLInputElement>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setCurrentUserId(user.id)

      const [{ data: forns }, { data: favs }] = await Promise.all([
        supabase.from('fornecedores')
          .select('id, slug, nome, segmento, cidade, bio, image_url, cover_url')
          .order('created_at', { ascending: false }),
        user
          ? supabase.from('fornecedores_favoritos')
              .select('fornecedor_id')
              .eq('arquiteto_id', user.id)
          : Promise.resolve({ data: [] as Array<{ fornecedor_id: string }> }),
      ])

      if (forns) {
        const mapped: SupplierCard[] = forns.map((f: Record<string, unknown>) => ({
          id: f.id as string,
          slug: (f.slug as string) ?? '',
          name: (f.nome as string) ?? '—',
          segment: (f.segmento as string) ?? null,
          city: (f.cidade as string) ?? null,
          bio: (f.bio as string) ?? null,
          image_url: (f.image_url as string) ?? null,
          cover_url: (f.cover_url as string) ?? null,
        }))
        setSuppliers(mapped)

        const segs = Array.from(new Set(mapped.map(s => s.segment).filter(Boolean) as string[]))
        setSegments(['Todos', ...segs])
      }

      if (favs) {
        setFavorites(new Set((favs as Array<{ fornecedor_id: string }>).map(r => r.fornecedor_id)))
      }

      setLoading(false)
    }
    load()
  }, [])

  async function toggleFavorite(supplierId: string) {
    if (!currentUserId) return
    const supabase = createClient()
    const isFav = favorites.has(supplierId)
    if (isFav) {
      await supabase.from('fornecedores_favoritos')
        .delete()
        .eq('arquiteto_id', currentUserId)
        .eq('fornecedor_id', supplierId)
      setFavorites(prev => { const s = new Set(prev); s.delete(supplierId); return s })
    } else {
      await supabase.from('fornecedores_favoritos')
        .insert({ arquiteto_id: currentUserId, fornecedor_id: supplierId })
      setFavorites(prev => new Set(Array.from(prev).concat(supplierId)))
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!quoteTarget || !currentUserId) return
    setSending(true)
    const supabase = createClient()

    let arquivo_url: string | null = null
    let arquivo_nome: string | null = null

    if (quoteFile) {
      const ts = Date.now()
      const path = `${currentUserId}/${ts}_${quoteFile.name}`
      const { data: up } = await supabase.storage.from('orcamentos').upload(path, quoteFile, { upsert: true })
      if (up) {
        arquivo_nome = quoteFile.name
        const { data: pub } = supabase.storage.from('orcamentos').getPublicUrl(up.path)
        arquivo_url = pub.publicUrl
      }
    }

    await supabase.from('orcamentos').insert({
      fornecedor_id: quoteTarget.id,
      arquiteto_id: currentUserId,
      mensagem: form.descricao.trim(),
      status: 'pendente',
      ...(arquivo_url ? { arquivo_url } : {}),
      ...(arquivo_nome ? { arquivo_nome } : {}),
    })
    setSending(false)
    setSent(true)
    setTimeout(() => {
      setQuoteTarget(null)
      setSent(false)
      setForm({ descricao: '' })
      setQuoteFile(null)
    }, 2200)
  }

  const filtered = segFilter === 'Todos'
    ? suppliers
    : suppliers.filter(s => s.segment === segFilter)

  const sortedFiltered = [...filtered].sort((a, b) => {
    const aFav = favorites.has(a.id) ? 1 : 0
    const bFav = favorites.has(b.id) ? 1 : 0
    return bFav - aFav
  })

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
        .af-card { background:#fff; border:1px solid rgba(0,0,0,0.08); border-radius:12px; overflow:hidden; transition:border-color 0.2s, box-shadow 0.2s; box-shadow:0 1px 3px rgba(0,0,0,0.06); }
        .af-card:hover { border-color:rgba(0,122,255,0.2); box-shadow:0 4px 16px rgba(0,0,0,0.1); }
        .af-img { width:100%; height:160px; object-fit:cover; display:block; transition:transform 0.4s ease; }
        .af-card:hover .af-img { transform:scale(1.04); }
        .af-seg-btn { padding:6px 16px; border-radius:20px; font-size:12px; font-weight:500; cursor:pointer; transition:all 0.15s; }
        .af-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.12); border-radius:8px; padding:10px 14px; color:#1a1a1a; font-size:13.5px; outline:none; transition:border-color 0.15s; box-sizing:border-box; font-family:inherit; }
        .af-inp:focus { border-color:rgba(0,122,255,0.45); }
        @keyframes af-modal-in { from{opacity:0;transform:scale(0.96) translateY(8px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .af-modal-box { animation:af-modal-in 0.2s ease; }
        .af-heart-btn:hover { transform:scale(1.15); }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Fornecedores</h1>
        <p style={{ fontSize: 13, color: '#8e8e93', margin: '5px 0 0' }}>
          Diretório de fornecedores parceiros certificados pela plataforma ARC
        </p>
      </div>

      {/* Segment filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 26, flexWrap: 'wrap' as const, alignItems: 'center' }}>
        {segments.map(seg => {
          const isActive = segFilter === seg
          return (
            <button key={seg} onClick={() => setSegFilter(seg)} className="af-seg-btn"
              style={{
                background: isActive ? 'rgba(0,122,255,0.1)' : '#fff',
                border: isActive ? '1px solid rgba(0,122,255,0.3)' : '1px solid rgba(0,0,0,0.12)',
                color: isActive ? '#007AFF' : '#6b6b6b',
              }}>
              {seg}
              {seg !== 'Todos' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
                  ({suppliers.filter(s => s.segment === seg).length})
                </span>
              )}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8e8e93' }}>
          {sortedFiltered.length} fornecedor{sortedFiltered.length !== 1 ? 'es' : ''} encontrado{sortedFiltered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      {sortedFiltered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8e8e93', fontSize: 14 }}>
          {suppliers.length === 0
            ? 'Nenhum fornecedor cadastrado ainda.'
            : 'Nenhum fornecedor nesse segmento.'}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
          {sortedFiltered.map(sup => {
            const isFav = favorites.has(sup.id)
            const segColor = SEG_COLOR[sup.segment ?? ''] ?? '#6b6b6b'
            const initial = sup.name[0]?.toUpperCase() ?? '?'

            return (
              <div key={sup.id} className="af-card">
                {/* Cover area */}
                <div style={{ position: 'relative', overflow: 'hidden', background: '#e8e8f0' }}>
                  {sup.cover_url
                    ? <img src={sup.cover_url} alt={sup.name} className="af-img" />
                    : <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e8e8f0, #d4d4dc)' }}>
                        {sup.image_url
                          ? <img src={sup.image_url} alt={sup.name} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '3px solid #fff', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }} />
                          : <div style={{ width: 64, height: 64, borderRadius: '50%', background: `${segColor}22`, border: `2px solid ${segColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 800, color: segColor }}>{initial}</div>}
                      </div>}

                  {/* Logo overlay on cover */}
                  {sup.cover_url && sup.image_url && (
                    <div style={{ position: 'absolute', bottom: 10, left: 12, width: 36, height: 36, borderRadius: '50%', border: '2px solid #fff', overflow: 'hidden', background: '#e5e5ea', boxShadow: '0 1px 4px rgba(0,0,0,0.2)' }}>
                      <img src={sup.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}

                  {/* Segment badge */}
                  {sup.segment && (
                    <div style={{ position: 'absolute', top: 10, right: 10, background: `${segColor}22`, border: `1px solid ${segColor}55`, color: segColor, fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 20, backdropFilter: 'blur(4px)' }}>
                      {sup.segment}
                    </div>
                  )}

                  {/* Heart */}
                  <button
                    onClick={() => toggleFavorite(sup.id)}
                    className="af-heart-btn"
                    style={{ position: 'absolute', top: 10, left: 10, width: 30, height: 30, borderRadius: '50%', background: 'rgba(255,255,255,0.92)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.18)', transition: 'transform 0.15s' }}
                    title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
                  >
                    <Heart size={13} fill={isFav ? '#ef4444' : 'none'} color={isFav ? '#ef4444' : '#8e8e93'} />
                  </button>
                </div>

                {/* Body */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a', marginBottom: 5 }}>{sup.name}</div>

                  {(sup.city || sup.segment) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 8, fontSize: 11.5, color: '#6b6b6b' }}>
                      {sup.city && <><MapPin size={10} />{sup.city}</>}
                    </div>
                  )}

                  {sup.bio && (
                    <p style={{ fontSize: 12.5, color: '#6b6b6b', lineHeight: 1.6, margin: '0 0 14px' }}>
                      {sup.bio.length > 100 ? sup.bio.slice(0, 100) + '…' : sup.bio}
                    </p>
                  )}

                  {!sup.bio && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 36, marginBottom: 14 }}>
                      <Package size={16} color="#c7c7cc" />
                    </div>
                  )}

                  {/* Buttons */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    {sup.slug && (
                      <Link href={`/fornecedor/${sup.slug}`} target="_blank"
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 12, padding: '8px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(0,0,0,0.12)', color: '#6b6b6b', textDecoration: 'none', fontWeight: 500 }}>
                        <ExternalLink size={12} /> Ver Perfil
                      </Link>
                    )}
                    <button onClick={() => { setQuoteTarget(sup); setForm({ descricao: '' }); setSent(false) }}
                      style={{ flex: 1, fontSize: 12, padding: '8px', borderRadius: 8, background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF', cursor: 'pointer', fontWeight: 600 }}>
                      Solicitar Orçamento
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Quote Modal */}
      {quoteTarget !== null && (
        <div onClick={e => { if (e.target === e.currentTarget) setQuoteTarget(null) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="af-modal-box"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.1)', borderRadius: 16, width: '100%', maxWidth: 500, padding: 30, boxShadow: '0 8px 40px rgba(0,0,0,0.15)' }}>
            {sent ? (
              <div style={{ textAlign: 'center' as const, padding: '22px 0' }}>
                <CheckCircle2 size={52} color="#34d399" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 19, fontWeight: 600, color: '#1a1a1a', marginBottom: 8 }}>Orçamento solicitado!</div>
                <div style={{ fontSize: 13, color: '#6b6b6b' }}>{quoteTarget.name} receberá sua solicitação em breve.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 600, color: '#1a1a1a' }}>Solicitar Orçamento</div>
                    <div style={{ fontSize: 12.5, color: '#6b6b6b', marginTop: 3 }}>
                      {quoteTarget.name}{quoteTarget.segment ? ` · ${quoteTarget.segment}` : ''}
                    </div>
                  </div>
                  <button onClick={() => setQuoteTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Descrição do serviço *</label>
                    <textarea className="af-inp" required rows={4}
                      placeholder="Descreva o serviço necessário, materiais, dimensões, prazo..."
                      value={form.descricao}
                      onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
                      style={{ resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Arquivo (opcional)</label>
                    <input ref={quoteFileRef} type="file" accept=".pdf,.dwg,.png,.jpg,.jpeg,.zip" style={{ display: 'none' }}
                      onChange={e => setQuoteFile(e.target.files?.[0] ?? null)} />
                    {quoteFile ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(0,122,255,0.06)', border: '1px solid rgba(0,122,255,0.2)', borderRadius: 8 }}>
                        <FileText size={14} color="#007AFF" />
                        <span style={{ flex: 1, fontSize: 12.5, color: '#1a1a1a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{quoteFile.name}</span>
                        <button type="button" onClick={() => { setQuoteFile(null); if (quoteFileRef.current) quoteFileRef.current.value = '' }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 0 }}>
                          <X size={13} />
                        </button>
                      </div>
                    ) : (
                      <button type="button" onClick={() => quoteFileRef.current?.click()}
                        style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1.5px dashed rgba(0,0,0,0.15)', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#8e8e93', fontSize: 12.5 }}>
                        <Upload size={14} /> Anexar PDF, DWG ou imagem
                      </button>
                    )}
                  </div>
                  <button type="submit" disabled={sending}
                    style={{ marginTop: 4, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '12px', fontSize: 14, fontWeight: 600, cursor: sending ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: sending ? 0.7 : 1 }}>
                    {sending ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Enviando...</> : <><Send size={14} /> Enviar Solicitação</>}
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
