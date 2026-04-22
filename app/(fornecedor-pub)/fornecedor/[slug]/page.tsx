'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { X, Star, MapPin, Phone, Globe, Send, CheckCircle2, Loader2, Package, AtSign } from 'lucide-react'
import { createClient } from '@/lib/supabase'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FornecedorData {
  id: string
  nome: string
  segmento: string | null
  cidade: string | null
  bio: string | null
  founded: string | null
  instagram: string | null
  whatsapp: string | null
  website: string | null
  email: string | null
  image_url: string | null
  cover_url: string | null
}

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

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#4f9cf9', Elétrica: '#34d399', Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316', Pintura: '#ef4444', Iluminação: '#007AFF', Outro: '#6b6b6b',
}

const TIPO_LABEL: Record<string, string> = {
  produto: 'Produto', servico: 'Serviço', portfolio: 'Portfólio',
  'serviço': 'Serviço', portfólio: 'Portfólio',
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FornecedorPublicPage() {
  const params = useParams()
  const router = useRouter()
  const slug = (params?.slug as string) ?? ''

  const [loading, setLoading] = useState(true)
  const [fornecedor, setFornecedor] = useState<FornecedorData | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])

  const [quoteOpen, setQuoteOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', descricao: '', data: '' })

  useEffect(() => {
    if (!slug) return
    async function load() {
      const supabase = createClient()
      const { data: forn } = await supabase
        .from('fornecedores')
        .select('id, nome, segmento, cidade, bio, founded, instagram, whatsapp, website, email, image_url, cover_url')
        .eq('slug', slug)
        .single()

      if (!forn) {
        router.replace('/')
        return
      }
      setFornecedor(forn as FornecedorData)

      const { data: prods } = await supabase
        .from('fornecedor_produtos')
        .select('id, nome, descricao, tipo, fornecedor_produto_imagens(id, url, ordem)')
        .eq('fornecedor_id', forn.id)
        .order('created_at', { ascending: false })

      if (prods) {
        setProdutos(prods.map((p: Record<string, unknown>) => ({
          id: p.id as string,
          nome: p.nome as string,
          descricao: p.descricao as string | null,
          tipo: (p.tipo as string) ?? 'produto',
          imagens: ((p.fornecedor_produto_imagens as ProdutoImagem[]) ?? [])
            .sort((a, b) => a.ordem - b.ordem),
        })))
      }
      setLoading(false)
    }
    load()
  }, [slug, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setQuoteOpen(false)
      setSubmitted(false)
      setForm({ nome: '', email: '', telefone: '', descricao: '', data: '' })
    }, 2200)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#f2f2f7' }}>
        <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  if (!fornecedor) return null

  const segColor = SEG_COLOR[fornecedor.segmento ?? ''] ?? '#007AFF'
  const coverFallback = 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)'
  const allImages = produtos.flatMap(p => p.imagens.map(img => ({ ...img, prodNome: p.nome, prodDesc: p.descricao })))

  return (
    <div style={{ minHeight: '100vh', background: '#f2f2f7', color: '#1a1a1a', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg) } }
        .fp-gallery-item { position:relative; overflow:hidden; border-radius:12px; cursor:pointer; background:#fff; box-shadow:0 1px 3px rgba(0,0,0,0.08); }
        .fp-gallery-img { width:100%; height:220px; object-fit:cover; display:block; transition:transform 0.45s ease; }
        .fp-gallery-item:hover .fp-gallery-img { transform:scale(1.07); }
        .fp-gallery-item:hover { box-shadow:0 8px 24px rgba(0,0,0,0.12); }
        .fp-gallery-overlay { position:absolute; inset:0; background:linear-gradient(to top,rgba(0,0,0,0.75) 0%,rgba(0,0,0,0.2) 60%,transparent 100%); opacity:0; transition:opacity 0.28s ease; display:flex; flex-direction:column; justify-content:flex-end; padding:16px; border-radius:12px; }
        .fp-gallery-item:hover .fp-gallery-overlay { opacity:1; }
        .fp-inp { width:100%; background:#f2f2f7; border:1px solid rgba(0,0,0,0.08); border-radius:10px; padding:10px 14px; color:#1a1a1a; font-size:13.5px; outline:none; transition:border-color 0.15s, background 0.15s; box-sizing:border-box; font-family:inherit; }
        .fp-inp:focus { border-color:rgba(0,122,255,0.4); background:#fff; }
        @keyframes fp-modal-in { from{opacity:0;transform:scale(0.96) translateY(10px)} to{opacity:1;transform:scale(1) translateY(0)} }
        .fp-modal-box { animation:fp-modal-in 0.22s ease; }
      `}</style>

      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 50, height: 64, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(0,0,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
        <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: '0.3em', color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>ARC</span>
        <button onClick={() => setQuoteOpen(true)} style={{ background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.25)', color: '#007AFF', borderRadius: 10, padding: '8px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          Solicitar Orçamento
        </button>
      </header>

      {/* Hero */}
      <div style={{ position: 'relative', height: 500, overflow: 'hidden' }}>
        {fornecedor.cover_url
          ? <img src={fornecedor.cover_url} alt={fornecedor.nome} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          : <div style={{ width: '100%', height: '100%', background: coverFallback }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.05) 100%)' }} />

        {/* Logo overlay */}
        {fornecedor.image_url && (
          <div style={{ position: 'absolute', top: 24, right: 40, width: 72, height: 72, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.9)', overflow: 'hidden', background: '#fff', boxShadow: '0 4px 16px rgba(0,0,0,0.3)' }}>
            <img src={fornecedor.image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '40px 60px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            {fornecedor.segmento && (
              <div style={{ background: `${segColor}1e`, border: `1px solid ${segColor}55`, color: segColor, fontSize: 11.5, fontWeight: 700, padding: '4px 14px', borderRadius: 20, letterSpacing: '0.06em' }}>
                {fornecedor.segmento}
              </div>
            )}
            {fornecedor.cidade && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 12.5 }}>
                <MapPin size={13} />{fornecedor.cidade}
              </div>
            )}
          </div>
          <h1 style={{ fontSize: 46, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.1 }}>{fornecedor.nome}</h1>
          {fornecedor.founded && (
            <div style={{ marginTop: 10, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
              Fundado em {fornecedor.founded}
            </div>
          )}
        </div>
      </div>

      {/* Main */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 40px' }}>

        {/* Bio + contact */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 56, marginBottom: 72 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#8e8e93', textTransform: 'uppercase' as const, marginBottom: 16 }}>Sobre nós</div>
            <p style={{ fontSize: 15.5, color: '#6b6b6b', lineHeight: 1.78, margin: 0 }}>
              {fornecedor.bio ?? 'Fornecedor especializado em serviços para projetos de arquitetura.'}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {(fornecedor.whatsapp || fornecedor.instagram || fornecedor.website || fornecedor.email) && (
              <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: '18px 20px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 10, color: '#8e8e93', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 14, fontWeight: 700 }}>Contato</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {fornecedor.whatsapp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#6b6b6b' }}>
                      <Phone size={13} color="#8e8e93" />{fornecedor.whatsapp}
                    </div>
                  )}
                  {fornecedor.instagram && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#6b6b6b' }}>
                      <AtSign size={13} color="#8e8e93" />{fornecedor.instagram}
                    </div>
                  )}
                  {fornecedor.website && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#6b6b6b' }}>
                      <Globe size={13} color="#8e8e93" />{fornecedor.website}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' as const, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#007AFF' }}>{produtos.length}</div>
                <div style={{ fontSize: 10.5, color: '#8e8e93', marginTop: 4 }}>Produtos</div>
              </div>
              {fornecedor.founded && (
                <div style={{ flex: 1, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12, padding: '16px 12px', textAlign: 'center' as const, boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: '#007AFF' }}>{fornecedor.founded}</div>
                  <div style={{ fontSize: 10.5, color: '#8e8e93', marginTop: 4 }}>Fundação</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Gallery (images from products) */}
        {allImages.length > 0 && (
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#8e8e93', textTransform: 'uppercase' as const, marginBottom: 22 }}>
              Galeria de Trabalhos
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {allImages.slice(0, 9).map(img => (
                <div key={img.id} className="fp-gallery-item">
                  <img src={img.url} alt={img.prodNome} className="fp-gallery-img" />
                  <div className="fp-gallery-overlay">
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{img.prodNome}</div>
                    {img.prodDesc && <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{img.prodDesc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Products */}
        {produtos.length > 0 && (
          <div style={{ marginBottom: 72 }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#8e8e93', textTransform: 'uppercase' as const, marginBottom: 22 }}>
              Produtos e Serviços
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {produtos.map(prod => {
                const firstImg = prod.imagens[0]?.url
                return (
                  <div key={prod.id} style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' }}>
                    {firstImg
                      ? <img src={firstImg} alt={prod.nome} style={{ width: '100%', height: 160, objectFit: 'cover', display: 'block' }} />
                      : <div style={{ width: '100%', height: 160, background: 'linear-gradient(135deg, #e8e8f0, #d4d4dc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Package size={28} color="#c7c7cc" /></div>}
                    <div style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: '#1a1a1a' }}>{prod.nome}</div>
                        <div style={{ fontSize: 9.5, padding: '2px 8px', borderRadius: 20, background: `${segColor}14`, border: `1px solid ${segColor}33`, color: segColor, fontWeight: 700, flexShrink: 0, marginLeft: 8 }}>
                          {TIPO_LABEL[prod.tipo] ?? prod.tipo}
                        </div>
                      </div>
                      {prod.descricao && <p style={{ fontSize: 12.5, color: '#6b6b6b', lineHeight: 1.55, margin: 0 }}>{prod.descricao}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginBottom: 60, background: 'rgba(0,122,255,0.05)', border: '1px solid rgba(0,122,255,0.12)', borderRadius: 18, padding: '54px 60px', textAlign: 'center' as const }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, color: '#1a1a1a', margin: '0 0 12px', letterSpacing: '-0.01em' }}>
            Pronto para transformar seu projeto?
          </h2>
          <p style={{ fontSize: 15, color: '#6b6b6b', margin: '0 0 32px', lineHeight: 1.6 }}>
            Solicite um orçamento sem compromisso. Respondemos em até 24 horas.
          </p>
          <button onClick={() => setQuoteOpen(true)} style={{ background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '14px 40px', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em' }}>
            Solicitar Orçamento
          </button>
        </div>

        {/* Stars placeholder */}
        <div style={{ marginBottom: 40, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 3 }}>
            {[1,2,3,4,5].map(s => <Star key={s} size={18} fill="none" color="#c7c7cc" />)}
          </div>
          <span style={{ fontSize: 13, color: '#8e8e93' }}>Sem avaliações ainda</span>
        </div>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)', background: '#fff', padding: '22px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: '0.3em', color: '#1a1a1a', fontFamily: 'Georgia, serif' }}>ARC</span>
        <span style={{ fontSize: 12, color: '#8e8e93' }}>Plataforma de conexão entre arquitetos e fornecedores premium</span>
      </div>

      {/* Quote Modal */}
      {quoteOpen && (
        <div onClick={e => { if (e.target === e.currentTarget) setQuoteOpen(false) }}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div className="fp-modal-box"
            style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, width: '100%', maxWidth: 520, padding: 32, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}>
            {submitted ? (
              <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
                <CheckCircle2 size={54} color="#34d399" style={{ marginBottom: 18 }} />
                <div style={{ fontSize: 21, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>Solicitação enviada!</div>
                <div style={{ fontSize: 13.5, color: '#6b6b6b' }}>A {fornecedor.nome} entrará em contato em breve.</div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>Solicitar Orçamento</div>
                    <div style={{ fontSize: 12.5, color: '#6b6b6b', marginTop: 3 }}>{fornecedor.nome}</div>
                  </div>
                  <button onClick={() => setQuoteOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}><X size={18} /></button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Nome completo *</label>
                      <input className="fp-inp" required placeholder="Seu nome" value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Telefone *</label>
                      <input className="fp-inp" required placeholder="(11) 99999-9999" value={form.telefone} onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))} />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>E-mail *</label>
                    <input className="fp-inp" type="email" required placeholder="seu@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Descrição do serviço *</label>
                    <textarea className="fp-inp" required rows={3} placeholder="Descreva o que você precisa..." value={form.descricao} onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))} style={{ resize: 'vertical' as const }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 600 }}>Data prevista de início</label>
                    <input className="fp-inp" type="date" value={form.data} onChange={e => setForm(f => ({ ...f, data: e.target.value }))} />
                  </div>
                  <button type="submit" style={{ marginTop: 4, background: '#007AFF', color: '#fff', border: 'none', borderRadius: 10, padding: '13px', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    <Send size={15} /> Enviar Solicitação
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
