import Link from 'next/link'

export const metadata = { title: 'Termos de Uso — ARC' }

const UPDATED = '25 de abril de 2026'

export default function TermosDeUsoPage() {
  return (
    <div style={{ background: '#f2f2f7', minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <p style={{ fontSize: 12, fontWeight: 300, color: '#8e8e93', marginBottom: 8 }}>
          Última atualização: {UPDATED}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 300, color: '#1a1a1a', marginBottom: 40, letterSpacing: '-0.3px' }}>
          Termos de Uso
        </h1>

        <Section title="1. A Plataforma ARC">
          <P>A ARC é uma plataforma digital que conecta clientes, arquitetos e fornecedores do setor de arquitetura e design de interiores. Operada por <strong>ARC Tecnologia Ltda.</strong>, CNPJ a confirmar, com sede em Blumenau, SC, a plataforma disponibiliza ferramentas para gestão de projetos, comunicação entre partes e vitrine de portfólios profissionais.</P>
          <P>Ao acessar ou utilizar a ARC, você concorda integralmente com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</P>
        </Section>

        <Section title="2. Tipos de Usuários">
          <P><strong>Cliente:</strong> pessoa física ou jurídica que contrata serviços de arquitetura por meio da plataforma. Pode criar projetos, enviar mensagens e acompanhar etapas.</P>
          <P><strong>Arquiteto:</strong> profissional habilitado que utiliza a ARC para captar clientes, gerenciar projetos, emitir orçamentos e exibir portfólio. Deve possuir registro ativo no CAU (Conselho de Arquitetura e Urbanismo).</P>
          <P><strong>Fornecedor:</strong> empresa ou profissional autônomo que oferece produtos, materiais ou serviços relacionados à construção e decoração. Pode receber solicitações de orçamento e exibir catálogo.</P>
        </Section>

        <Section title="3. Direitos e Deveres">
          <P><strong>De todos os usuários:</strong> fornecer informações verdadeiras no cadastro; manter sigilo de credenciais de acesso; não usar a plataforma para fins ilícitos, spam ou engenharia reversa; respeitar os demais usuários.</P>
          <P><strong>Dos Arquitetos:</strong> manter portfólio atualizado e de sua autoria ou com devidas autorizações; honorar orçamentos emitidos dentro do prazo de validade; não captar clientes fora da plataforma durante projeto em andamento.</P>
          <P><strong>Dos Fornecedores:</strong> cumprir prazos e especificações de orçamentos aceitos; manter catálogo com informações precisas sobre disponibilidade e preços.</P>
          <P><strong>Da ARC:</strong> disponibilizar a plataforma com razoável continuidade; notificar previamente sobre manutenções programadas; proteger dados conforme nossa Política de Privacidade.</P>
        </Section>

        <Section title="4. Assinaturas e Cobrança">
          <P>O acesso a funcionalidades avançadas está sujeito a planos de assinatura mensais ou anuais, conforme tabela disponível em <em>usearc.com.br/planos</em>. Os preços são exibidos em Reais (BRL) e incluem os impostos aplicáveis.</P>
          <P>A cobrança é recorrente e automática na data de renovação. Cartões de crédito são processados por gateway de pagamento certificado PCI-DSS. A ARC não armazena dados de cartão.</P>
          <P>Assinaturas anuais com desconto antecipado não são reembolsáveis proporcionalmente após 30 dias de uso, exceto por falha comprovada da plataforma.</P>
        </Section>

        <Section title="5. Cancelamento">
          <P>O usuário pode cancelar sua assinatura a qualquer momento nas configurações de conta. O acesso permanece ativo até o fim do período já pago.</P>
          <P>A ARC reserva-se o direito de suspender ou encerrar contas que violem estes Termos, mediante aviso prévio por email, exceto em casos de fraude comprovada, onde a suspensão pode ser imediata.</P>
          <P>Para exclusão definitiva de dados, consulte nossa <Link href="/privacidade" style={{ color: '#007AFF', textDecoration: 'none' }}>Política de Privacidade</Link>.</P>
        </Section>

        <Section title="6. Propriedade Intelectual">
          <P>Os portfólios, projetos e materiais publicados pelos arquitetos permanecem de propriedade intelectual dos respectivos autores. A ARC recebe apenas licença não exclusiva para exibição na plataforma.</P>
          <P>A marca ARC, logotipos, código-fonte e interface da plataforma são propriedade da ARC Tecnologia Ltda. É proibida a reprodução sem autorização expressa.</P>
          <P>Ao publicar conteúdo, o usuário declara possuir todos os direitos necessários e autoriza a ARC a exibi-lo na plataforma e em materiais de divulgação relacionados ao serviço.</P>
        </Section>

        <Section title="7. Limitação de Responsabilidade">
          <P>A ARC atua como intermediária tecnológica. Não nos responsabilizamos por: (a) qualidade técnica dos serviços prestados por arquitetos; (b) inadimplência entre usuários; (c) divergências entre orçamentos e valores finais de obras; (d) perdas decorrentes de uso inadequado da plataforma.</P>
          <P>Nossa responsabilidade máxima em qualquer hipótese é limitada ao valor pago pelo usuário nos últimos 3 meses de assinatura.</P>
        </Section>

        <Section title="8. Privacidade e Dados">
          <P>O tratamento de dados pessoais é regido pela nossa <Link href="/privacidade" style={{ color: '#007AFF', textDecoration: 'none' }}>Política de Privacidade</Link>, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).</P>
        </Section>

        <Section title="9. Alterações nos Termos">
          <P>A ARC pode atualizar estes Termos a qualquer momento, com aviso por email com antecedência mínima de 15 dias. O uso continuado da plataforma após essa data implica aceitação das novas condições.</P>
        </Section>

        <Section title="10. Foro e Lei Aplicável">
          <P>Estes Termos são regidos pelas leis da República Federativa do Brasil. Fica eleita a Comarca de <strong>Blumenau, Estado de Santa Catarina</strong>, como foro exclusivo para dirimir quaisquer controvérsias decorrentes deste instrumento, com renúncia a qualquer outro, por mais privilegiado que seja.</P>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 300, color: '#8e8e93' }}>
          Dúvidas? Entre em contato: <a href="mailto:contato@usearc.com.br" style={{ color: '#007AFF', textDecoration: 'none' }}>contato@usearc.com.br</a>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, fontWeight: 300, color: '#3a3a3c', lineHeight: 1.75, margin: 0 }}>{children}</p>
}
