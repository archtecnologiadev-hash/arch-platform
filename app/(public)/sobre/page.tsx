import Link from 'next/link'

export const metadata = { title: 'Sobre a ARC' }

export default function SobrePage() {
  return (
    <div style={{ background: '#f2f2f7', minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <h1 style={{ fontSize: 30, fontWeight: 300, color: '#1a1a1a', marginBottom: 12, letterSpacing: '-0.3px' }}>
          O que é a ARC
        </h1>
        <p style={{ fontSize: 16, fontWeight: 300, color: '#8e8e93', marginBottom: 48, lineHeight: 1.7 }}>
          Uma plataforma que conecta arquitetos, clientes e fornecedores em um único ambiente digital — eliminando planilhas, emails dispersos e processos manuais na gestão de projetos de arquitetura e design de interiores.
        </p>

        <Section title="Nossa missão">
          <P>Modernizar o jeito como projetos de arquitetura são gerenciados no Brasil, oferecendo uma plataforma integrada que valoriza o trabalho do profissional e simplifica a experiência do cliente — com transparência em cada etapa.</P>
        </Section>

        <Section title="Para quem é a ARC">
          <Card
            label="Clientes"
            color="#007AFF"
            description="Você quer reformar, construir ou decorar e não sabe como gerenciar tudo isso. Na ARC você encontra arquitetos verificados, acompanha o andamento do projeto em tempo real, aprova orçamentos e se comunica diretamente com o profissional — sem intermediários."
          />
          <Card
            label="Arquitetos"
            color="#34c759"
            description="Gerencie todos os seus projetos em um único lugar: etapas, orçamentos, comunicação com clientes, portfólio profissional e captação de novos leads. Foque no que importa — criar. A burocracia fica conosco."
          />
          <Card
            label="Fornecedores"
            color="#ff9500"
            description="Exiba seu catálogo de produtos e serviços para arquitetos ativos na plataforma. Receba solicitações de orçamento segmentadas por projeto, agilize propostas e amplie sua presença no mercado arquitetônico."
          />
        </Section>

        <Section title="Como funciona">
          <Step n="1" text="O arquiteto cria seu perfil e publica seu portfólio na plataforma." />
          <Step n="2" text="O cliente encontra o arquiteto, solicita contato e inicia um projeto." />
          <Step n="3" text="O projeto avança por etapas rastreáveis: briefing, conceito, projeto executivo, aprovação e obra." />
          <Step n="4" text="Orçamentos de fornecedores chegam diretamente dentro do projeto, sem troca de emails." />
          <Step n="5" text="Cliente e arquiteto se comunicam em tempo real, com histórico centralizado." />
        </Section>

        <Section title="Nossa base">
          <P>A ARC nasceu em <strong>Blumenau, Santa Catarina</strong> — uma das cidades com maior concentração de escritórios de arquitetura do Sul do Brasil — com o propósito de ser referência nacional no segmento.</P>
        </Section>

        <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/cadastro" style={{
            padding: '12px 24px', background: '#007AFF', color: '#fff',
            borderRadius: 10, fontSize: 14, fontWeight: 400, textDecoration: 'none',
          }}>
            Criar conta grátis
          </Link>
          <Link href="/contato" style={{
            padding: '12px 24px', background: 'rgba(0,122,255,0.08)',
            border: '1px solid rgba(0,122,255,0.2)', color: '#007AFF',
            borderRadius: 10, fontSize: 14, fontWeight: 400, textDecoration: 'none',
          }}>
            Falar com a equipe
          </Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 18, fontWeight: 300, color: '#1a1a1a', marginBottom: 16 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{children}</div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, fontWeight: 300, color: '#3a3a3c', lineHeight: 1.75, margin: 0 }}>{children}</p>
}

function Card({ label, color, description }: { label: string; color: string; description: string }) {
  return (
    <div style={{
      background: '#ffffff', borderRadius: 12, padding: '20px 20px',
      border: '1px solid rgba(0,0,0,0.07)',
    }}>
      <span style={{
        display: 'inline-block', fontSize: 11, fontWeight: 500, color,
        background: `${color}18`, borderRadius: 6, padding: '3px 10px', marginBottom: 10,
        letterSpacing: '0.04em', textTransform: 'uppercase',
      }}>
        {label}
      </span>
      <p style={{ fontSize: 14, fontWeight: 300, color: '#3a3a3c', lineHeight: 1.7, margin: 0 }}>{description}</p>
    </div>
  )
}

function Step({ n, text }: { n: string; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div style={{
        width: 26, height: 26, borderRadius: '50%', background: 'rgba(0,122,255,0.1)',
        border: '1px solid rgba(0,122,255,0.2)', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 500, color: '#007AFF',
      }}>
        {n}
      </div>
      <p style={{ fontSize: 14, fontWeight: 300, color: '#3a3a3c', lineHeight: 1.7, margin: 0, paddingTop: 3 }}>{text}</p>
    </div>
  )
}
