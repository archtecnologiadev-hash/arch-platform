import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade — ARC' }

const UPDATED = '25 de abril de 2026'

export default function PrivacidadePage() {
  return (
    <div style={{ background: '#f2f2f7', minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <p style={{ fontSize: 12, fontWeight: 300, color: '#8e8e93', marginBottom: 8 }}>
          Última atualização: {UPDATED}
        </p>
        <h1 style={{ fontSize: 30, fontWeight: 300, color: '#1a1a1a', marginBottom: 40, letterSpacing: '-0.3px' }}>
          Política de Privacidade
        </h1>

        <Section title="1. Quem somos">
          <P>A <strong>ARC Tecnologia Ltda.</strong> (doravante &ldquo;ARC&rdquo;) é a controladora dos dados pessoais tratados nesta política, conforme definição da Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018). Operamos a plataforma usearc.com.br, com sede em Blumenau, SC.</P>
        </Section>

        <Section title="2. Dados que coletamos">
          <P><strong>Dados de cadastro:</strong> nome completo, endereço de email, senha (armazenada em hash), tipo de usuário (cliente, arquiteto ou fornecedor) e, opcionalmente, telefone, cidade e foto de perfil.</P>
          <P><strong>Dados de projetos:</strong> informações inseridas em projetos, mensagens trocadas entre usuários, arquivos enviados (plantas, imagens, documentos), etapas e orçamentos.</P>
          <P><strong>Dados de pagamento:</strong> histórico de assinaturas e status de cobrança. Dados de cartão são tratados exclusivamente pelo processador de pagamentos (não armazenamos número de cartão).</P>
          <P><strong>Dados de navegação:</strong> endereço IP, tipo de navegador, páginas visitadas, tempo de sessão e cookies de funcionamento. Coletados automaticamente para segurança e melhoria do serviço.</P>
          <P><strong>Dados de portfólio:</strong> imagens, descrições e informações de projetos publicados voluntariamente por arquitetos.</P>
        </Section>

        <Section title="3. Finalidade do uso dos dados">
          <P>Utilizamos seus dados para: (a) criar e gerenciar sua conta; (b) viabilizar a comunicação entre clientes, arquitetos e fornecedores; (c) processar pagamentos de assinatura; (d) enviar notificações transacionais relacionadas ao seu uso da plataforma; (e) cumprir obrigações legais; (f) prevenir fraudes e abusos.</P>
          <P>Não vendemos dados pessoais a terceiros. Não utilizamos seus dados para publicidade comportamental de terceiros.</P>
        </Section>

        <Section title="4. Compartilhamento entre usuários">
          <P>A natureza colaborativa da plataforma implica compartilhamento limitado e necessário:</P>
          <P>• O <strong>arquiteto</strong> vê nome, email e informações de contato dos clientes vinculados a projetos em andamento.</P>
          <P>• O <strong>cliente</strong> vê o portfólio público e dados de contato profissional do arquiteto contratado.</P>
          <P>• <strong>Fornecedores</strong> recebem apenas as informações necessárias para responder a solicitações de orçamento.</P>
          <P>Portfólios marcados como públicos são visíveis para qualquer visitante da plataforma.</P>
        </Section>

        <Section title="5. Seus direitos como titular dos dados (LGPD)">
          <P>Nos termos da LGPD, você tem direito a:</P>
          <P>• <strong>Acesso:</strong> solicitar confirmação de que tratamos seus dados e obter cópia.</P>
          <P>• <strong>Correção:</strong> corrigir dados incompletos, inexatos ou desatualizados.</P>
          <P>• <strong>Anonimização / Bloqueio / Eliminação:</strong> solicitar que dados desnecessários ou excessivos sejam anonimizados, bloqueados ou eliminados.</P>
          <P>• <strong>Portabilidade:</strong> receber seus dados em formato estruturado para transferência a outro fornecedor.</P>
          <P>• <strong>Revogação de consentimento:</strong> retirar seu consentimento a qualquer momento, sem prejuízo aos tratamentos anteriores.</P>
          <P>• <strong>Oposição:</strong> opor-se ao tratamento realizado com base em legítimo interesse.</P>
          <P>Para exercer esses direitos, entre em contato pelo email <a href="mailto:privacidade@usearc.com.br" style={{ color: '#007AFF', textDecoration: 'none' }}>privacidade@usearc.com.br</a>. Respondemos em até 15 dias úteis.</P>
        </Section>

        <Section title="6. Como solicitar exclusão de conta">
          <P>Você pode solicitar a exclusão definitiva da sua conta e todos os dados associados por email para <a href="mailto:privacidade@usearc.com.br" style={{ color: '#007AFF', textDecoration: 'none' }}>privacidade@usearc.com.br</a> com o assunto &ldquo;Exclusão de conta&rdquo;.</P>
          <P>Processamos a solicitação em até 30 dias. Dados necessários ao cumprimento de obrigações legais (como registros fiscais) podem ser retidos pelo prazo exigido por lei antes da exclusão definitiva.</P>
          <P>Atenção: a exclusão é irreversível. Projetos, mensagens e portfólios associados à conta serão removidos.</P>
        </Section>

        <Section title="7. Cookies" id="cookies">
          <P>Utilizamos cookies para:</P>
          <P>• <strong>Sessão e autenticação:</strong> manter você conectado (essenciais, não desativáveis).</P>
          <P>• <strong>Preferências:</strong> lembrar configurações de interface.</P>
          <P>• <strong>Análise de uso:</strong> estatísticas agregadas e anônimas de navegação.</P>
          <P>Você pode gerenciar cookies nas configurações do seu navegador. A desativação de cookies essenciais pode impedir o funcionamento do login.</P>
        </Section>

        <Section title="8. Retenção de dados">
          <P>Dados de conta são retidos enquanto a conta estiver ativa. Após exclusão: dados de navegação são eliminados em 90 dias; dados de projetos são eliminados em 30 dias; registros de cobrança são retidos por 5 anos conforme obrigação fiscal.</P>
        </Section>

        <Section title="9. Segurança">
          <P>Adotamos medidas técnicas e organizacionais para proteger seus dados: conexões criptografadas (TLS), autenticação gerenciada via Supabase (SOC 2 Type II), senhas em hash e controle de acesso por perfil. Em caso de incidente de segurança, notificaremos os titulares afetados e a ANPD conforme a legislação.</P>
        </Section>

        <Section title="10. Encarregado de dados (DPO)">
          <P>Nosso Encarregado de Proteção de Dados pode ser contactado por:</P>
          <P>Email: <a href="mailto:contato@usearc.com.br" style={{ color: '#007AFF', textDecoration: 'none' }}>contato@usearc.com.br</a></P>
          <P>Assunto: &ldquo;DPO — Proteção de Dados&rdquo;</P>
        </Section>

        <Section title="11. Alterações desta Política">
          <P>Esta Política pode ser atualizada periodicamente. Notificaremos mudanças significativas por email. A versão vigente está sempre disponível em <em>usearc.com.br/privacidade</em>.</P>
        </Section>

        <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid rgba(0,0,0,0.08)', fontSize: 12, fontWeight: 300, color: '#8e8e93' }}>
          Leia também: <Link href="/termos-de-uso" style={{ color: '#007AFF', textDecoration: 'none' }}>Termos de Uso</Link>
        </div>
      </div>
    </div>
  )
}

function Section({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <div id={id} style={{ marginBottom: 36 }}>
      <h2 style={{ fontSize: 16, fontWeight: 400, color: '#1a1a1a', marginBottom: 12 }}>{title}</h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}

function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 14, fontWeight: 300, color: '#3a3a3c', lineHeight: 1.75, margin: 0 }}>{children}</p>
}
