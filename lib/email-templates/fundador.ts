import { baseTemplate, btn, divider, label, value } from './base'

interface FundadorEmailProps {
  nome: string
  email: string
  senha: string
  loginUrl: string
}

export function fundadorEmail(p: FundadorEmailProps): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Bem-vindo à ARC, ${p.nome}!</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;line-height:1.6;">
      Você foi convidado pessoalmente para fazer parte do grupo seleto de Fundadores da ARC.
      Como Fundador, você tem <strong style="color:#1a1a1a;">acesso vitalício e gratuito</strong> à plataforma.
    </p>

    ${divider()}

    <div style="background:rgba(251,191,36,0.08);border:1px solid rgba(251,191,36,0.35);border-radius:12px;padding:20px;margin-bottom:20px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#92400e;">★ &nbsp;Acesso Vitalício Garantido</p>
      <p style="margin:0;font-size:13px;color:#1a1a1a;line-height:1.5;">
        Seu acesso é permanente e gratuito. Sem cobranças, sem expiração.
      </p>
    </div>

    <div style="background:#f2f2f7;border-radius:12px;padding:20px;margin-bottom:24px;">
      <p style="margin:0 0 14px;font-size:11px;font-weight:700;letter-spacing:0.09em;color:#8e8e93;">SUAS CREDENCIAIS DE ACESSO</p>
      ${label('Email')}
      ${value(p.email)}
      ${label('Senha temporária')}
      <div style="font-family:monospace;font-size:18px;font-weight:700;color:#007AFF;background:#ffffff;border:1px solid rgba(0,122,255,0.2);border-radius:8px;padding:10px 14px;letter-spacing:0.08em;margin-bottom:12px;">${p.senha}</div>
      <p style="margin:0;font-size:12px;color:#8e8e93;">Recomendamos trocar sua senha no primeiro acesso em Minha Conta.</p>
    </div>

    ${btn(p.loginUrl, 'Acessar a ARC →')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;line-height:1.6;">
      Dúvidas? Responda este email ou escreva para <a href="mailto:contato@usearc.com.br" style="color:#8e8e93;">contato@usearc.com.br</a>
    </p>
  `)
}
