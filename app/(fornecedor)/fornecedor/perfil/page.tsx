'use client'

import { useState } from 'react'
import { Star, MapPin, Globe, Phone, CheckCircle2 } from 'lucide-react'

const SEGMENTS = ['Marcenaria', 'Elétrica', 'Vidraçaria', 'Gesseiro', 'Pintura', 'Iluminação', 'Outro']

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#4f9cf9',
  Elétrica: '#34d399',
  Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316',
  Pintura: '#ef4444',
  Iluminação: '#c8a96e',
  Outro: '#888',
}

export default function FornecedorPerfilPage() {
  const [form, setForm] = useState({
    name: 'Marcenaria Silva & Filhos',
    segment: 'Marcenaria',
    city: 'São Paulo, SP',
    bio: 'Há mais de 14 anos transformamos madeira em arte e funcionalidade. Especializados em marcenaria fina para projetos residenciais e comerciais de alto padrão.',
    instagram: '@marcenaria.silva',
    whatsapp: '(11) 98765-4321',
    email: 'contato@marcenaria-silva.com.br',
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&q=80',
    founded: '2010',
  })
  const [saved, setSaved] = useState(false)

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }))

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const segColor = SEG_COLOR[form.segment] ?? '#888'

  return (
    <div
      style={{
        padding: '32px 36px',
        minHeight: '100vh',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#d0d0d0',
      }}
    >
      <style>{`
        .pf-inp { width: 100%; background: #0e0e0e; border: 1px solid #1c1c1c; border-radius: 8px; padding: 10px 14px; color: #d0d0d0; font-size: 13.5px; outline: none; transition: border-color 0.15s; color-scheme: dark; box-sizing: border-box; font-family: inherit; }
        .pf-inp:focus { border-color: rgba(200,169,110,0.45); }
        .pf-label { font-size: 11.5px; color: #555; display: block; margin-bottom: 7px; font-weight: 600; }
        .pf-save-btn { background: #c8a96e; color: #080808; border: none; border-radius: 9px; padding: 12px 28px; font-size: 14px; font-weight: 700; cursor: pointer; transition: background 0.15s; }
        .pf-save-btn:hover { background: #d4b87a; }
      `}</style>

      {/* Header */}
      <div style={{ marginBottom: 30 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0f0', margin: 0 }}>Meu Perfil</h1>
        <p style={{ fontSize: 13, color: '#444', margin: '5px 0 0' }}>
          Edite as informações que aparecerão no seu perfil público
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 32, alignItems: 'flex-start' }}>
        {/* ── Form ── */}
        <form onSubmit={handleSave}>
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #161616',
              borderRadius: 14,
              padding: '28px 28px',
              display: 'flex',
              flexDirection: 'column',
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#333',
                textTransform: 'uppercase' as const,
                paddingBottom: 12,
                borderBottom: '1px solid #111',
              }}
            >
              Informações da empresa
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="pf-label">Nome da empresa *</label>
                <input className="pf-inp" required value={form.name} onChange={set('name')} />
              </div>
              <div>
                <label className="pf-label">Segmento *</label>
                <select className="pf-inp" value={form.segment} onChange={set('segment')}>
                  {SEGMENTS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="pf-label">Cidade / Estado *</label>
                <input className="pf-inp" required value={form.city} onChange={set('city')} placeholder="São Paulo, SP" />
              </div>
              <div>
                <label className="pf-label">Ano de fundação</label>
                <input className="pf-inp" value={form.founded} onChange={set('founded')} placeholder="2010" />
              </div>
            </div>

            <div>
              <label className="pf-label">Bio / Apresentação *</label>
              <textarea
                className="pf-inp"
                required
                rows={4}
                value={form.bio}
                onChange={set('bio')}
                placeholder="Descreva sua empresa, diferenciais e especialidades..."
                style={{ resize: 'vertical' as const }}
              />
              <div style={{ fontSize: 11, color: '#333', marginTop: 4, textAlign: 'right' as const }}>
                {form.bio.length}/500 caracteres
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#333',
                textTransform: 'uppercase' as const,
                paddingTop: 8,
                paddingBottom: 12,
                borderTop: '1px solid #111',
                borderBottom: '1px solid #111',
              }}
            >
              Contato e redes sociais
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="pf-label">Instagram</label>
                <input className="pf-inp" value={form.instagram} onChange={set('instagram')} placeholder="@empresa.exemplo" />
              </div>
              <div>
                <label className="pf-label">WhatsApp</label>
                <input className="pf-inp" value={form.whatsapp} onChange={set('whatsapp')} placeholder="(11) 99999-9999" />
              </div>
            </div>

            <div>
              <label className="pf-label">E-mail de contato</label>
              <input className="pf-inp" type="email" value={form.email} onChange={set('email')} placeholder="contato@empresa.com.br" />
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: '#333',
                textTransform: 'uppercase' as const,
                paddingTop: 8,
                paddingBottom: 12,
                borderTop: '1px solid #111',
                borderBottom: '1px solid #111',
              }}
            >
              Foto de capa
            </div>

            <div>
              <label className="pf-label">URL da foto de capa</label>
              <input
                className="pf-inp"
                value={form.cover}
                onChange={set('cover')}
                placeholder="https://..."
              />
              {form.cover && (
                <div
                  style={{
                    marginTop: 10,
                    borderRadius: 8,
                    overflow: 'hidden',
                    height: 100,
                    border: '1px solid #1c1c1c',
                  }}
                >
                  <img
                    src={form.cover}
                    alt="Capa"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' as const }}
                  />
                </div>
              )}
            </div>

            {/* Save button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 4 }}>
              <button type="submit" className="pf-save-btn">
                Salvar Alterações
              </button>
              {saved && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 13,
                    color: '#34d399',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={16} color="#34d399" />
                  Perfil atualizado!
                </div>
              )}
            </div>
          </div>
        </form>

        {/* ── Preview card ── */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div
            style={{
              fontSize: 11,
              color: '#383838',
              fontWeight: 700,
              letterSpacing: '0.12em',
              textTransform: 'uppercase' as const,
              marginBottom: 12,
            }}
          >
            Pré-visualização do perfil
          </div>
          <div
            style={{
              background: '#0a0a0a',
              border: '1px solid #161616',
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {/* Cover */}
            <div style={{ position: 'relative', height: 130 }}>
              {form.cover ? (
                <img
                  src={form.cover}
                  alt="Capa"
                  style={{ width: '100%', height: '100%', objectFit: 'cover' as const, display: 'block' }}
                />
              ) : (
                <div style={{ width: '100%', height: '100%', background: '#111' }} />
              )}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'linear-gradient(to top, rgba(8,8,8,0.85) 0%, transparent 60%)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  left: 14,
                  right: 14,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div
                    style={{
                      background: `${segColor}22`,
                      border: `1px solid ${segColor}44`,
                      color: segColor,
                      fontSize: 9.5,
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 20,
                    }}
                  >
                    {form.segment}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 3, color: '#888', fontSize: 10 }}>
                    <MapPin size={9} />
                    {form.city || 'Cidade, Estado'}
                  </div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#f0f0f0', lineHeight: 1.2 }}>
                  {form.name || 'Nome da empresa'}
                </div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 10 }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={11} fill="#c8a96e" color="#c8a96e" />
                ))}
                <span style={{ fontSize: 12, color: '#c8a96e', fontWeight: 700, marginLeft: 2 }}>4.9</span>
                <span style={{ fontSize: 11, color: '#444' }}>(47 avaliações)</span>
              </div>

              <p
                style={{
                  fontSize: 12,
                  color: '#666',
                  lineHeight: 1.6,
                  margin: '0 0 12px',
                  display: '-webkit-box',
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: 'vertical' as const,
                  overflow: 'hidden',
                }}
              >
                {form.bio || 'Sua bio aparecerá aqui...'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {form.instagram && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#555' }}>
                    <Globe size={11} color="#444" />
                    {form.instagram}
                  </div>
                )}
                {form.whatsapp && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, color: '#555' }}>
                    <Phone size={11} color="#444" />
                    {form.whatsapp}
                  </div>
                )}
              </div>

              <div
                style={{
                  marginTop: 14,
                  background: '#c8a96e',
                  color: '#080808',
                  borderRadius: 8,
                  padding: '9px',
                  fontSize: 12,
                  fontWeight: 700,
                  textAlign: 'center' as const,
                }}
              >
                Solicitar Orçamento
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: 12,
              fontSize: 11,
              color: '#2e2e2e',
              textAlign: 'center' as const,
              lineHeight: 1.5,
            }}
          >
            Esta é a aparência do seu link de perfil público em{' '}
            <span style={{ color: '#c8a96e' }}>arch.com/fornecedor/marcenaria-silva</span>
          </div>
        </div>
      </div>
    </div>
  )
}
