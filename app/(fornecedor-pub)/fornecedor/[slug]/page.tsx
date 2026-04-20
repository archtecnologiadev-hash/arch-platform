'use client'

import { useState } from 'react'
import { X, Star, MapPin, Phone, Globe, Play, Send, CheckCircle2 } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface GalleryItem {
  id: number
  image: string
  title: string
  description: string
}

interface Review {
  id: number
  author: string
  company: string
  rating: number
  text: string
  date: string
}

interface SupplierPublicData {
  name: string
  segment: string
  segmentFull: string
  city: string
  cover: string
  bio: string
  founded: number
  phone: string
  instagram: string
  rating: number
  reviewCount: number
  projectCount: number
  gallery: GalleryItem[]
  videoThumb: string
  reviews: Review[]
}

// ─── Segment colours ──────────────────────────────────────────────────────────

const SEG_COLOR: Record<string, string> = {
  Marcenaria: '#4f9cf9',
  Elétrica: '#34d399',
  Vidraçaria: '#a78bfa',
  Gesseiro: '#f97316',
  Pintura: '#ef4444',
}

// ─── Mock supplier data ───────────────────────────────────────────────────────

const SUPPLIERS: Record<string, SupplierPublicData> = {
  'marcenaria-silva': {
    name: 'Marcenaria Silva & Filhos',
    segment: 'Marcenaria',
    segmentFull: 'Marcenaria · Móveis Planejados',
    city: 'São Paulo, SP',
    cover: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1600&q=80',
    bio: 'Há mais de 14 anos transformamos madeira em arte e funcionalidade. Especializados em marcenaria fina para projetos residenciais e comerciais de alto padrão, nossa equipe de artesãos combina técnica apurada com materiais nobres para entregar móveis únicos que definem ambientes.',
    founded: 2010,
    phone: '(11) 98765-4321',
    instagram: '@marcenaria.silva',
    rating: 4.9,
    reviewCount: 47,
    projectCount: 130,
    gallery: [
      { id: 1, image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=600&q=80', title: 'Cozinha Contemporânea', description: 'Armários em MDF lacado branco com puxadores em aço inox' },
      { id: 2, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', title: 'Sala de Estar', description: 'Painel em madeira ripada com iluminação embutida' },
      { id: 3, image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80', title: 'Suíte Master', description: 'Closet planejado em carvalho americano com espelhado' },
      { id: 4, image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600&q=80', title: 'Home Office', description: 'Bancada integrada com nichos e estante modular' },
      { id: 5, image: 'https://images.unsplash.com/photo-1560185009-dddbd820b6bb?w=600&q=80', title: 'Quarto de Casal', description: 'Guarda-roupa deslizante em madeirite natural' },
      { id: 6, image: 'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?w=600&q=80', title: 'Mesa de Jantar', description: 'Mesa em nogueira maciça com acabamento artesanal' },
    ],
    videoThumb: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=1200&q=80',
    reviews: [
      { id: 1, author: 'Arq. Serafim Figueiredo', company: 'Studio SF Arquitetura', rating: 5, text: 'Trabalho impecável. A equipe da Silva entregou os armários da cozinha antes do prazo e com qualidade acima do esperado. Já indiquei para outros clientes.', date: 'Mar 2026' },
      { id: 2, author: 'Arq. Marina Castro', company: 'MCA Projetos', rating: 5, text: 'Parceria incrível. O acabamento dos móveis planejados é excepcional — madeira nobre, dobradiças silenciosas, tudo perfeito. Minha cliente ficou encantada.', date: 'Fev 2026' },
      { id: 3, author: 'Arq. Ricardo Leal', company: 'Leal Arquitetura', rating: 5, text: 'Pontualidade e qualidade são os diferenciais da Marcenaria Silva. Recomendo sem hesitar para projetos de alto padrão.', date: 'Jan 2026' },
      { id: 4, author: 'Arq. Fernanda Lima', company: 'FL Interiores', rating: 4, text: 'Ótima execução do closet planejado. O orçamento foi justo e o atendimento muito profissional.', date: 'Dez 2025' },
    ],
  },
  'eletrica-voltagem': {
    name: 'Elétrica Voltagem',
    segment: 'Elétrica',
    segmentFull: 'Instalações Elétricas · Automação',
    city: 'São Paulo, SP',
    cover: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1600&q=80',
    bio: 'Especialistas em instalações elétricas de alta complexidade para projetos arquitetônicos premium. Nossa equipe certificada garante segurança, eficiência energética e integração perfeita com sistemas de automação e iluminação de design.',
    founded: 2014,
    phone: '(11) 97654-3210',
    instagram: '@eletrica.voltagem',
    rating: 4.7,
    reviewCount: 89,
    projectCount: 210,
    gallery: [
      { id: 1, image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80', title: 'Painel Elétrico Premium', description: 'Quadro de distribuição com disjuntores certificados' },
      { id: 2, image: 'https://images.unsplash.com/photo-1486312338219-ce68d2c6f44d?w=600&q=80', title: 'Automação Residencial', description: 'Sistema de automação integrado com iluminação cênica' },
      { id: 3, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80', title: 'Iluminação de Design', description: 'Ponto elétrico preciso para luminárias pendentes' },
      { id: 4, image: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?w=600&q=80', title: 'Cablagem Estruturada', description: 'Infraestrutura de rede e dados embutida' },
      { id: 5, image: 'https://images.unsplash.com/photo-1547194935-b3b0c37e84df?w=600&q=80', title: 'Tomadas Especiais', description: 'Pontos USB-C e carregamento sem fio integrados' },
      { id: 6, image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&q=80', title: 'Projeto Comercial', description: 'Instalação elétrica de escritório de alto padrão' },
    ],
    videoThumb: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200&q=80',
    reviews: [
      { id: 1, author: 'Arq. Serafim Figueiredo', company: 'Studio SF Arquitetura', rating: 5, text: 'A Voltagem é nossa parceira padrão para projetos residenciais. Organização, pontualidade e resultado impecável no sistema elétrico da Residência Costa.', date: 'Abr 2026' },
      { id: 2, author: 'Arq. Paulo Mendes', company: 'PM Arquitetura', rating: 4, text: 'Executaram um projeto elétrico complexo com automação completa sem nenhum retrabalho. Equipe muito qualificada.', date: 'Mar 2026' },
      { id: 3, author: 'Arq. Juliana Torres', company: 'JT Design', rating: 5, text: 'Recomendo fortemente. A atenção ao detalhe é impressionante — todo ponto elétrico exatamente onde eu projetei.', date: 'Fev 2026' },
    ],
  },
  'vidracaria-cristal': {
    name: 'Vidraçaria Cristal',
    segment: 'Vidraçaria',
    segmentFull: 'Vidraçaria · Esquadrias de Alumínio',
    city: 'São Paulo, SP',
    cover: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&q=80',
    bio: 'Referência em vidraçaria premium para arquitetura contemporânea. Trabalhamos com vidros temperados, laminados e espelhos de alta qualidade, além de esquadrias de alumínio linha pesada para projetos residenciais e comerciais.',
    founded: 2008,
    phone: '(11) 96543-2109',
    instagram: '@vidracaria.cristal',
    rating: 4.8,
    reviewCount: 63,
    projectCount: 175,
    gallery: [
      { id: 1, image: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=600&q=80', title: 'Fachada em Vidro', description: 'Fachada de vidro temperado 10mm com esquadria de alumínio' },
      { id: 2, image: 'https://images.unsplash.com/photo-1560185127-6a35cba96e9a?w=600&q=80', title: 'Janelas Panorâmicas', description: 'Vidro low-e para eficiência térmica e acústica' },
      { id: 3, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', title: 'Box de Banheiro', description: 'Box em vidro temperado 8mm com perfil inox escovado' },
      { id: 4, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', title: 'Divisória de Vidro', description: 'Divisória em vidro laminado fosco para escritório' },
      { id: 5, image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=600&q=80', title: 'Guarda-corpo', description: 'Guarda-corpo em vidro temperado 12mm fixação estrutural' },
      { id: 6, image: 'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=600&q=80', title: 'Espelho Decorativo', description: 'Painel de espelho bisotado com moldura em inox' },
    ],
    videoThumb: 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80',
    reviews: [
      { id: 1, author: 'Arq. Marina Castro', company: 'MCA Projetos', rating: 5, text: 'A Vidraçaria Cristal fez os painéis de vidro da Cobertura Moderna com perfeição absoluta. Medição precisa, instalação limpa.', date: 'Mar 2026' },
      { id: 2, author: 'Arq. Carlos Brandão', company: 'CB Arquitetura', rating: 5, text: 'Especialistas em vidraçaria de alto padrão. Executaram as janelas panorâmicas sem nenhum problema.', date: 'Jan 2026' },
      { id: 3, author: 'Arq. Luciana Ramos', company: 'Studio LR', rating: 4, text: 'Ótimo trabalho nos boxes e guarda-corpos de vidro. Prazo cumprido e equipe organizada.', date: 'Dez 2025' },
    ],
  },
  'gesseiro-acabamentos': {
    name: 'Gesseiro Acabamentos Pro',
    segment: 'Gesseiro',
    segmentFull: 'Gesseiro · Dry Wall · Sancas',
    city: 'Campinas, SP',
    cover: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1600&q=80',
    bio: 'Especialistas em acabamentos em gesso, dry wall e sancas para projetos de interiores de alto padrão. Com equipe técnica especializada, entregamos tetos rebaixados, molduras e sancas de iluminação com acabamento milimétrico.',
    founded: 2012,
    phone: '(19) 98877-6655',
    instagram: '@gesseiro.acabamentos',
    rating: 4.6,
    reviewCount: 34,
    projectCount: 89,
    gallery: [
      { id: 1, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', title: 'Teto Rebaixado', description: 'Teto rebaixado em gesso com iluminação cênica embutida' },
      { id: 2, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', title: 'Sanca de Iluminação', description: 'Sanca em U com fita LED e acabamento perfeito' },
      { id: 3, image: 'https://images.unsplash.com/photo-1560185127-6a35cba96e9a?w=600&q=80', title: 'Dry Wall', description: 'Paredes em dry wall com acabamento fino para pintura' },
      { id: 4, image: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&q=80', title: 'Molduras Decorativas', description: 'Molduras em gesso para corredores e salas de estar' },
      { id: 5, image: 'https://images.unsplash.com/photo-1600607688969-a5bfcd646154?w=600&q=80', title: 'Nicho em Gesso', description: 'Nicho integrado com iluminação frontal em banheiro' },
      { id: 6, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', title: 'Sala de Jantar', description: 'Bandeja de gesso com spot embutido personalizado' },
    ],
    videoThumb: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=1200&q=80',
    reviews: [
      { id: 1, author: 'Arq. Serafim Figueiredo', company: 'Studio SF Arquitetura', rating: 5, text: 'O acabamento do Gesseiro Acabamentos Pro é impressionante. A sanca de iluminação ficou perfeita, exatamente como projetei.', date: 'Abr 2026' },
      { id: 2, author: 'Arq. André Vieira', company: 'AV Projetos', rating: 4, text: 'Equipe técnica qualificada para gesso e dry wall. Resultado sempre de alto padrão.', date: 'Fev 2026' },
      { id: 3, author: 'Arq. Renata Dias', company: 'RD Interiores', rating: 5, text: 'Recomendo! Fizeram o teto rebaixado de forma impecável, sem poeira e no prazo.', date: 'Jan 2026' },
    ],
  },
  'pintura-arte-final': {
    name: 'Pintura Arte Final',
    segment: 'Pintura',
    segmentFull: 'Pintura · Textura · Grafite',
    city: 'São Paulo, SP',
    cover: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1600&q=80',
    bio: 'Arte e técnica em cada centímetro pintado. Especialistas em pintura de alto padrão para projetos residenciais e comerciais, utilizando tintas premium, técnicas especiais de textura e acabamentos diferenciados que valorizam cada ambiente.',
    founded: 2016,
    phone: '(11) 95432-1098',
    instagram: '@pintura.artefinal',
    rating: 4.9,
    reviewCount: 112,
    projectCount: 280,
    gallery: [
      { id: 1, image: 'https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=600&q=80', title: 'Parede Texturizada', description: 'Textura cimento queimado com pigmentação especial' },
      { id: 2, image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=600&q=80', title: 'Quarto Minimalista', description: 'Pintura lisa em branco gelo com acabamento acetinado' },
      { id: 3, image: 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&q=80', title: 'Sala de Estar', description: 'Efeito marmorizado em parede de destaque' },
      { id: 4, image: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&q=80', title: 'Ambiente Cinza', description: 'Pintura monocromática em tons frios com acabamento fosco' },
      { id: 5, image: 'https://images.unsplash.com/photo-1560185127-6a35cba96e9a?w=600&q=80', title: 'Cozinha Colorida', description: 'Parede de cor com tinta lavável premium' },
      { id: 6, image: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600&q=80', title: 'Varanda Gourmet', description: 'Textura grafiato externo em cinza escuro' },
    ],
    videoThumb: 'https://images.unsplash.com/photo-1562259929-b4e1fd3aef09?w=1200&q=80',
    reviews: [
      { id: 1, author: 'Arq. Fernanda Lima', company: 'FL Interiores', rating: 5, text: 'O trabalho da Arte Final é extraordinário. A textura cimento queimado ficou muito melhor do que eu esperava.', date: 'Abr 2026' },
      { id: 2, author: 'Arq. Bruno Carvalho', company: 'BC Arquitetura', rating: 5, text: 'Pontualidade, capricho e acabamento impecável. Equipe muito profissional e atenciosa.', date: 'Mar 2026' },
      { id: 3, author: 'Arq. Isabela Nunes', company: 'Studio IN', rating: 5, text: 'Os melhores pintores com quem já trabalhei. Técnica refinada e resultado sempre surpreendente.', date: 'Fev 2026' },
      { id: 4, author: 'Arq. Ricardo Leal', company: 'Leal Arquitetura', rating: 4, text: 'Ótima equipe, excelente resultado. Recomendo para projetos com acabamento diferenciado.', date: 'Jan 2026' },
    ],
  },
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function FornecedorPublicPage({ params }: { params: { slug: string } }) {
  const supplier = SUPPLIERS[params.slug] ?? SUPPLIERS['marcenaria-silva']
  const segmentColor = SEG_COLOR[supplier.segment] ?? '#007AFF'

  const [quoteModalOpen, setQuoteModalOpen] = useState(false)
  const [videoPlaying, setVideoPlaying] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ nome: '', email: '', telefone: '', descricao: '', data: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => {
      setQuoteModalOpen(false)
      setSubmitted(false)
      setForm({ nome: '', email: '', telefone: '', descricao: '', data: '' })
    }, 2200)
  }

  const authorInitials = (name: string) =>
    name.split(' ').filter((_, i) => i > 0).map((w) => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f2f2f7',
        color: '#1a1a1a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <style>{`
        .fp-gallery-item { position: relative; overflow: hidden; border-radius: 12px; cursor: pointer; background: #ffffff; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .fp-gallery-img { width: 100%; height: 220px; object-fit: cover; display: block; transition: transform 0.45s ease; }
        .fp-gallery-item:hover .fp-gallery-img { transform: scale(1.07); }
        .fp-gallery-item:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .fp-gallery-overlay { position: absolute; inset: 0; background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, transparent 100%); opacity: 0; transition: opacity 0.28s ease; display: flex; flex-direction: column; justify-content: flex-end; padding: 16px; border-radius: 12px; }
        .fp-gallery-item:hover .fp-gallery-overlay { opacity: 1; }
        .fp-review-card { background: #ffffff; border: 1px solid rgba(0,0,0,0.08); border-radius: 16px; padding: 22px; transition: box-shadow 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
        .fp-review-card:hover { box-shadow: 0 8px 24px rgba(0,0,0,0.12); }
        .fp-cta-btn { background: #007AFF; color: #ffffff; border: none; border-radius: 10px; padding: 15px 40px; font-size: 15px; font-weight: 700; cursor: pointer; letter-spacing: 0.04em; transition: background 0.15s, transform 0.1s; }
        .fp-cta-btn:hover { background: #0066d6; transform: translateY(-1px); }
        .fp-cta-btn:active { transform: translateY(0); }
        .fp-inp { width: 100%; background: #f2f2f7; border: 1px solid rgba(0,0,0,0.08); border-radius: 10px; padding: 10px 14px; color: #1a1a1a; font-size: 13.5px; outline: none; transition: border-color 0.15s, background 0.15s; box-sizing: border-box; font-family: inherit; }
        .fp-inp:focus { border-color: rgba(0,122,255,0.4); background: #ffffff; }
        @keyframes fp-modal-in { from { opacity: 0; transform: scale(0.96) translateY(10px); } to { opacity: 1; transform: scale(1) translateY(0); } }
        .fp-modal-box { animation: fp-modal-in 0.22s ease; }
        @keyframes fp-spin { to { transform: rotate(360deg); } }
        .fp-spin { animation: fp-spin 0.9s linear infinite; }
      `}</style>

      {/* ══ HEADER ══ */}
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          height: 64,
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(12px)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 40px',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: '0.3em',
            color: '#1a1a1a',
            fontFamily: 'Georgia, serif',
          }}
        >
          ARC
        </span>
        <button
          onClick={() => setQuoteModalOpen(true)}
          style={{
            background: 'rgba(0,122,255,0.08)',
            border: '1px solid rgba(0,122,255,0.25)',
            color: '#007AFF',
            borderRadius: 10,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Solicitar Orçamento
        </button>
      </header>

      {/* ══ HERO ══ */}
      <div style={{ position: 'relative', height: 520, overflow: 'hidden' }}>
        <img
          src={supplier.cover}
          alt={supplier.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(0,0,0,0.80) 0%, rgba(0,0,0,0.35) 45%, rgba(0,0,0,0.05) 100%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '44px 60px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div
              style={{
                background: `${segmentColor}1e`,
                border: `1px solid ${segmentColor}55`,
                color: segmentColor,
                fontSize: 11.5,
                fontWeight: 700,
                padding: '4px 14px',
                borderRadius: 20,
                letterSpacing: '0.06em',
              }}
            >
              {supplier.segmentFull}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'rgba(255,255,255,0.7)', fontSize: 12.5 }}>
              <MapPin size={13} />
              {supplier.city}
            </div>
          </div>
          <h1
            style={{
              fontSize: 48,
              fontWeight: 800,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {supplier.name}
          </h1>
          <div
            style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}
          >
            <div style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={14}
                  fill={s <= Math.round(supplier.rating) ? '#007AFF' : 'none'}
                  color="#007AFF"
                />
              ))}
            </div>
            <span style={{ fontSize: 14, color: '#007AFF', fontWeight: 700 }}>
              {supplier.rating}
            </span>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.55)' }}>
              ({supplier.reviewCount} avaliações · {supplier.projectCount} projetos entregues)
            </span>
          </div>
        </div>
      </div>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '64px 40px' }}>

        {/* Bio + contact */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 290px',
            gap: 64,
            marginBottom: 80,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.18em',
                color: '#8e8e93',
                textTransform: 'uppercase' as const,
                marginBottom: 18,
              }}
            >
              Sobre nós
            </div>
            <p style={{ fontSize: 15.5, color: '#6b6b6b', lineHeight: 1.78, margin: 0 }}>
              {supplier.bio}
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                background: '#ffffff',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 16,
                padding: '18px 20px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: '#8e8e93',
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 14,
                  fontWeight: 700,
                }}
              >
                Contato
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#6b6b6b' }}>
                  <Phone size={13} color="#8e8e93" />
                  {supplier.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontSize: 13, color: '#6b6b6b' }}>
                  <Globe size={13} color="#8e8e93" />
                  {supplier.instagram}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 12,
                  padding: '16px 12px',
                  textAlign: 'center' as const,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#007AFF' }}>
                  {supplier.projectCount}+
                </div>
                <div style={{ fontSize: 10.5, color: '#8e8e93', marginTop: 4 }}>Projetos</div>
              </div>
              <div
                style={{
                  flex: 1,
                  background: '#ffffff',
                  border: '1px solid rgba(0,0,0,0.08)',
                  borderRadius: 12,
                  padding: '16px 12px',
                  textAlign: 'center' as const,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800, color: '#007AFF' }}>
                  {supplier.founded}
                </div>
                <div style={{ fontSize: 10.5, color: '#8e8e93', marginTop: 4 }}>Fundação</div>
              </div>
            </div>
          </div>
        </div>

        {/* Gallery */}
        <div style={{ marginBottom: 80 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#8e8e93',
              textTransform: 'uppercase' as const,
              marginBottom: 22,
            }}
          >
            Galeria de Trabalhos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {supplier.gallery.map((item) => (
              <div key={item.id} className="fp-gallery-item">
                <img src={item.image} alt={item.title} className="fp-gallery-img" />
                <div className="fp-gallery-overlay">
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>{item.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Video */}
        <div style={{ marginBottom: 80 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#8e8e93',
              textTransform: 'uppercase' as const,
              marginBottom: 22,
            }}
          >
            Vídeo Institucional
          </div>
          <div
            onClick={() => setVideoPlaying(true)}
            style={{
              position: 'relative',
              borderRadius: 16,
              overflow: 'hidden',
              cursor: 'pointer',
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              aspectRatio: '16/9',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
            }}
          >
            {!videoPlaying ? (
              <>
                <img
                  src={supplier.videoThumb}
                  alt="Vídeo"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: 0.75 }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: '50%',
                      background: 'rgba(0,122,255,0.92)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: '0 4px 28px rgba(0,122,255,0.45)',
                    }}
                  >
                    <Play size={28} fill="#ffffff" color="#ffffff" style={{ marginLeft: 4 }} />
                  </div>
                </div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: 22,
                    left: 26,
                    color: '#ffffff',
                    fontSize: 15,
                    fontWeight: 600,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}
                >
                  {supplier.name} — Conheça nosso trabalho
                </div>
              </>
            ) : (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 16,
                }}
              >
                <div
                  className="fp-spin"
                  style={{
                    width: 48,
                    height: 48,
                    border: '3px solid #007AFF',
                    borderTop: '3px solid transparent',
                    borderRadius: '50%',
                  }}
                />
                <span style={{ color: '#007AFF', fontSize: 13 }}>Carregando vídeo...</span>
              </div>
            )}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            marginBottom: 80,
            background: 'rgba(0,122,255,0.05)',
            border: '1px solid rgba(0,122,255,0.12)',
            borderRadius: 18,
            padding: '54px 60px',
            textAlign: 'center' as const,
          }}
        >
          <h2
            style={{
              fontSize: 30,
              fontWeight: 800,
              color: '#1a1a1a',
              margin: '0 0 12px',
              letterSpacing: '-0.01em',
            }}
          >
            Pronto para transformar seu projeto?
          </h2>
          <p style={{ fontSize: 15, color: '#6b6b6b', margin: '0 0 34px', lineHeight: 1.6 }}>
            Solicite um orçamento sem compromisso. Respondemos em até 24 horas.
          </p>
          <button className="fp-cta-btn" onClick={() => setQuoteModalOpen(true)}>
            Solicitar Orçamento
          </button>
        </div>

        {/* Reviews */}
        <div style={{ marginBottom: 60 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.18em',
              color: '#8e8e93',
              textTransform: 'uppercase' as const,
              marginBottom: 22,
            }}
          >
            O que dizem os arquitetos
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16 }}>
            {supplier.reviews.map((rev) => (
              <div key={rev.id} className="fp-review-card">
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    <div
                      style={{
                        width: 38,
                        height: 38,
                        borderRadius: '50%',
                        background: 'rgba(0,122,255,0.08)',
                        border: '1.5px solid rgba(0,122,255,0.2)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#007AFF',
                        flexShrink: 0,
                      }}
                    >
                      {authorInitials(rev.author)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
                        {rev.author}
                      </div>
                      <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 2 }}>{rev.company}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 2 }}>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        size={11}
                        fill={s <= rev.rating ? '#007AFF' : 'none'}
                        color="#007AFF"
                      />
                    ))}
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.68, margin: 0 }}>
                  {rev.text}
                </p>
                <div style={{ fontSize: 11, color: '#8e8e93', marginTop: 12 }}>{rev.date}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: '1px solid rgba(0,0,0,0.08)',
          background: '#ffffff',
          padding: '22px 40px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            letterSpacing: '0.3em',
            color: '#1a1a1a',
            fontFamily: 'Georgia, serif',
          }}
        >
          ARC
        </span>
        <span style={{ fontSize: 12, color: '#8e8e93' }}>
          Plataforma de conexão entre arquitetos e fornecedores premium
        </span>
      </div>

      {/* ══ QUOTE MODAL ══ */}
      {quoteModalOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setQuoteModalOpen(false)
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.45)',
            backdropFilter: 'blur(6px)',
            zIndex: 200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 20,
          }}
        >
          <div
            className="fp-modal-box"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 16,
              width: '100%',
              maxWidth: 520,
              padding: 32,
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            }}
          >
            {submitted ? (
              <div style={{ textAlign: 'center' as const, padding: '24px 0' }}>
                <CheckCircle2 size={54} color="#34d399" style={{ marginBottom: 18 }} />
                <div style={{ fontSize: 21, fontWeight: 700, color: '#1a1a1a', marginBottom: 8 }}>
                  Solicitação enviada!
                </div>
                <div style={{ fontSize: 13.5, color: '#6b6b6b' }}>
                  A {supplier.name} entrará em contato em breve.
                </div>
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 26,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: '#1a1a1a' }}>
                      Solicitar Orçamento
                    </div>
                    <div style={{ fontSize: 12.5, color: '#6b6b6b', marginTop: 3 }}>
                      {supplier.name}
                    </div>
                  </div>
                  <button
                    onClick={() => setQuoteModalOpen(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#8e8e93',
                      padding: 4,
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div>
                      <label
                        style={{
                          fontSize: 11.5,
                          color: '#6b6b6b',
                          display: 'block',
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Nome completo *
                      </label>
                      <input
                        className="fp-inp"
                        required
                        placeholder="Seu nome"
                        value={form.nome}
                        onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label
                        style={{
                          fontSize: 11.5,
                          color: '#6b6b6b',
                          display: 'block',
                          marginBottom: 6,
                          fontWeight: 600,
                        }}
                      >
                        Telefone *
                      </label>
                      <input
                        className="fp-inp"
                        required
                        placeholder="(11) 99999-9999"
                        value={form.telefone}
                        onChange={(e) => setForm((f) => ({ ...f, telefone: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11.5,
                        color: '#6b6b6b',
                        display: 'block',
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      E-mail *
                    </label>
                    <input
                      className="fp-inp"
                      type="email"
                      required
                      placeholder="seu@email.com"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11.5,
                        color: '#6b6b6b',
                        display: 'block',
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      Descrição do serviço *
                    </label>
                    <textarea
                      className="fp-inp"
                      required
                      rows={3}
                      placeholder="Descreva o que você precisa..."
                      value={form.descricao}
                      onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                      style={{ resize: 'vertical' as const }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontSize: 11.5,
                        color: '#6b6b6b',
                        display: 'block',
                        marginBottom: 6,
                        fontWeight: 600,
                      }}
                    >
                      Data prevista de início
                    </label>
                    <input
                      className="fp-inp"
                      type="date"
                      value={form.data}
                      onChange={(e) => setForm((f) => ({ ...f, data: e.target.value }))}
                    />
                  </div>
                  <button
                    type="submit"
                    style={{
                      marginTop: 6,
                      background: '#007AFF',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: 10,
                      padding: '13px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                    }}
                  >
                    <Send size={15} />
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
