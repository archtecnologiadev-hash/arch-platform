'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Star, MapPin, ExternalLink, Send, X, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface SupplierCard {
  id: number
  slug: string
  name: string
  segment: string
  city: string
  rating: number
  reviewCount: number
  projectCount: number
  description: string
  cover: string
  color: string
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const SUPPLIERS: SupplierCard[] = [
  {
    id: 1,
    slug: 'marcenaria-silva',
    name: 'Marcenaria Silva & Filhos',
    segment: 'Marcenaria',
    city: 'São Paulo, SP',
    rating: 4.9,
    reviewCount: 47,
    projectCount: 130,
    description: 'Móveis planejados e marcenaria fina para projetos residenciais e comerciais de alto padrão.',
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600&q=80',
    color: '#4f9cf9',
  },
  {
    id: 2,
    slug: 'eletrica-voltagem',
    name: 'Elétrica Voltagem',
    segment: 'Elétrica',
    city: 'São Paulo, SP',
    rating: 4.7,
    reviewCount: 89,
    projectCount: 210,
    description: 'Instalações elétricas de alta complexidade e automação residencial e comercial.',
    cover: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=600&q=80',
    color: '#34d399',
  },
  {
    id: 3,
    slug: 'vidracaria-cristal',
    name: 'Vidraçaria Cristal',
    segment: 'Vidraçaria',
    city: 'São Paulo, SP',
    rating: 4.8,
    reviewCount: 63,
    projectCount: 175,
    description: 'Vidros temperados, laminados e esquadrias de alumínio linha pesada para fachadas e interiores.',
    cover: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80',
    color: '#a78bfa',
  },
  {
    id: 4,
    slug: 'gesseiro-acabamentos',
    name: 'Gesseiro Acabamentos Pro',
    segment: 'Gesseiro',
    city: 'Campinas, SP',
    rating: 4.6,
    reviewCount: 34,
    projectCount: 89,
    description: 'Tetos rebaixados, dry wall e sancas de iluminação com acabamento milimétrico.',
    cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=600&q=80',
    color: '#f97316',
  },
  {
    id: 5,
    slug: 'pintura-arte-final',
    name: 'Pintura Arte Final',
    segment: 'Pintura',
    city: 'São Paulo, SP',
    rating: 4.9,
    reviewCount: 112,
    projectCount: 280,
    description: 'Pintura premium, texturas especiais e acabamentos diferenciados para projetos de interiores.',
    cover: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=600&q=80',
    color: '#ef4444',
  },
]

const SEGMENTS = ['Todos', 'Marcenaria', 'Elétrica', 'Vidraçaria', 'Gesseiro', 'Pintura']

// ─── Component ────────────────────────────────────────────────────────────────

export default function ArquitetoFornecedoresPage() {
  const [segFilter, setSegFilter] = useState('Todos')
  const [quoteTarget, setQuoteTarget] = useState<SupplierCard | null>(null)
  const [form, setForm] = useState({ descricao: '', projeto: '', data: '' })
  const [sent, setSent] = useState(false)

  const filtered =
    segFilter === 'Todos' ? SUPPLIERS : SUPPLIERS.filter((s) => s.segment === segFilter)

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setTimeout(() => {
      setQuoteTarget(null)
      setSent(false)
      setForm({ descricao: '', projeto: '', data: '' })
    }, 2200)
  }

  return (
    <div
      style={{
        padding: '32px 36px',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#1a1a1a',
        background: '#f2f2f7',
      }}
    >
      <style>{`
        .af-card { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; transition: border-color 0.2s, box-shadow 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
        .af-card:hover { border-color: rgba(0,122,255,0.2); box-shadow: 0 4px 16px rgba(0,0,0,0.1); }
        .af-img { width: 100%; height: 160px; object-fit: cover; display: block; transition: transform 0.4s ease; }
        .af-card:hover .af-img { transform: scale(1.04); }
        .af-seg-btn { padding: 6px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; cursor: pointer; transition: all 0.15s; }
        .af-inp { width: 100%; background: #f2f2f7; border: 1px solid rgba(0,0,0,0.12); border-radius: 8px; padding: 10px 14px; color: #1a1a1a; font-size: 13.5px; outline: none; transition: border-color 0.15s; box-sizing: border-box; font-family: inherit; }
        .af-inp:focus { border-color: rgba(0,122,255,0.45); }
        @keyframes af-modal-in { from { opacity: 0; transform: scale(0.96) translateY(8px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .af-modal-box { animation: af-modal-in 0.2s ease; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 500, color: '#1a1a1a', margin: 0 }}>
          Fornecedores
        </h1>
        <p style={{ fontSize: 13, color: '#8e8e93', margin: '5px 0 0' }}>
          Diretório de fornecedores parceiros certificados pela plataforma ARC
        </p>
      </div>

      {/* Segment filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 26, flexWrap: 'wrap' as const }}>
        {SEGMENTS.map((seg) => {
          const isActive = segFilter === seg
          return (
            <button
              key={seg}
              onClick={() => setSegFilter(seg)}
              className="af-seg-btn"
              style={{
                background: isActive ? 'rgba(0,122,255,0.1)' : '#ffffff',
                border: isActive ? '1px solid rgba(0,122,255,0.3)' : '1px solid rgba(0,0,0,0.12)',
                color: isActive ? '#007AFF' : '#6b6b6b',
              }}
            >
              {seg}
              {seg !== 'Todos' && (
                <span style={{ marginLeft: 4, opacity: 0.6 }}>
                  ({SUPPLIERS.filter((s) => s.segment === seg).length})
                </span>
              )}
            </button>
          )
        })}
        <div style={{ marginLeft: 'auto', fontSize: 12, color: '#8e8e93', alignSelf: 'center' }}>
          {filtered.length} fornecedor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
        {filtered.map((sup) => (
          <div key={sup.id} className="af-card">
            {/* Image area */}
            <div style={{ position: 'relative', overflow: 'hidden' }}>
              <img src={sup.cover} alt={sup.name} className="af-img" />
              {/* Segment badge */}
              <div
                style={{
                  position: 'absolute',
                  top: 12,
                  right: 12,
                  background: `${sup.color}22`,
                  border: `1px solid ${sup.color}55`,
                  color: sup.color,
                  fontSize: 10,
                  fontWeight: 600,
                  padding: '3px 10px',
                  borderRadius: 20,
                  backdropFilter: 'blur(4px)',
                }}
              >
                {sup.segment}
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: '#1a1a1a', marginBottom: 4 }}>
                {sup.name}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <div style={{ display: 'flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={11}
                      fill={s <= Math.round(sup.rating) ? '#007AFF' : 'none'}
                      color="#007AFF"
                    />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: '#007AFF', fontWeight: 600 }}>{sup.rating}</span>
                <span style={{ fontSize: 11, color: '#8e8e93' }}>({sup.reviewCount})</span>
                <span style={{ fontSize: 11, color: '#8e8e93' }}>·</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, color: '#6b6b6b' }}>
                  <MapPin size={10} />
                  {sup.city}
                </div>
              </div>
              <p
                style={{
                  fontSize: 12.5,
                  color: '#6b6b6b',
                  lineHeight: 1.6,
                  margin: '0 0 14px',
                }}
              >
                {sup.description}
              </p>
              <div style={{ fontSize: 11, color: '#8e8e93', marginBottom: 14 }}>
                {sup.projectCount}+ projetos entregues
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 8 }}>
                <Link
                  href={`/fornecedor/${sup.slug}`}
                  target="_blank"
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 5,
                    fontSize: 12,
                    padding: '8px',
                    borderRadius: 8,
                    background: 'transparent',
                    border: '1px solid rgba(0,0,0,0.12)',
                    color: '#6b6b6b',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <ExternalLink size={12} />
                  Ver Perfil
                </Link>
                <button
                  onClick={() => setQuoteTarget(sup)}
                  style={{
                    flex: 1,
                    fontSize: 12,
                    padding: '8px',
                    borderRadius: 8,
                    background: 'rgba(0,122,255,0.08)',
                    border: '1px solid rgba(0,122,255,0.2)',
                    color: '#007AFF',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  Solicitar Orçamento
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quote Modal */}
      {quoteTarget !== null && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuoteTarget(null)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="af-modal-box"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 500,
              padding: 30,
              boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
            }}
          >
            {sent ? (
              <div style={{ textAlign: 'center' as const, padding: '22px 0' }}>
                <CheckCircle2 size={52} color="#34d399" style={{ marginBottom: 16 }} />
                <div style={{ fontSize: 19, fontWeight: 500, color: '#1a1a1a', marginBottom: 8 }}>
                  Orçamento solicitado!
                </div>
                <div style={{ fontSize: 13, color: '#6b6b6b' }}>
                  {quoteTarget.name} receberá sua solicitação em breve.
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 22,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 500, color: '#1a1a1a' }}>
                      Solicitar Orçamento
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6b6b6b', marginTop: 3 }}>
                      {quoteTarget.name} · {quoteTarget.segment}
                    </div>
                  </div>
                  <button
                    onClick={() => setQuoteTarget(null)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8e8e93', padding: 4 }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Projeto *
                    </label>
                    <input
                      className="af-inp"
                      required
                      placeholder="Nome do projeto"
                      value={form.projeto}
                      onChange={(e) => setForm((f) => ({ ...f, projeto: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Descrição do serviço *
                    </label>
                    <textarea
                      className="af-inp"
                      required
                      rows={3}
                      placeholder="Descreva o serviço necessário, materiais, dimensões..."
                      value={form.descricao}
                      onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                      style={{ resize: 'vertical' as const }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11.5, color: '#6b6b6b', display: 'block', marginBottom: 6, fontWeight: 500 }}>
                      Data prevista de início
                    </label>
                    <input
                      className="af-inp"
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      marginTop: 4,
                      background: '#007AFF',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '12px',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Send size={14} />
                    Enviar Solicitação
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
