import { baseTemplate, btn, divider } from './base'

interface MensagemEmailProps {
  destinatarioNome: string
  remetenteNome: string
  preview: string
  conversaUrl: string
}

export function mensagemEmail(p: MensagemEmailProps): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Nova mensagem</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;">
      Olá, ${p.destinatarioNome}! Você recebeu uma mensagem de <strong>${p.remetenteNome}</strong>.
    </p>

    ${divider()}

    <div style="background:#f2f2f7;border-radius:10px;padding:14px 16px;margin-bottom:8px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#8e8e93;">${p.remetenteNome.toUpperCase()}</p>
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;">${p.preview}</p>
    </div>

    ${btn(p.conversaUrl, 'Abrir conversa')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;">
      Acesse o painel para responder e ver o histórico completo da conversa.
    </p>
  `)
}
