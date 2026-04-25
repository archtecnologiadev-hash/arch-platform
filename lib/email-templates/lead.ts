import { baseTemplate, btn, label, value, divider } from './base'

interface LeadEmailProps {
  arquitetoNome: string
  clienteNome: string
  clienteEmail: string
  clienteTelefone?: string | null
  mensagem: string
  painelUrl: string
}

export function leadEmail(p: LeadEmailProps): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Novo lead recebido</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;">
      Olá, ${p.arquitetoNome}! Um cliente entrou em contato pelo seu perfil na ARC.
    </p>

    ${divider()}

    ${label('Nome do cliente')}
    ${value(p.clienteNome)}

    ${label('E-mail')}
    ${value(`<a href="mailto:${p.clienteEmail}" style="color:#007AFF;text-decoration:none;">${p.clienteEmail}</a>`)}

    ${p.clienteTelefone ? `${label('Telefone')}${value(p.clienteTelefone)}` : ''}

    ${label('Mensagem')}
    <div style="background:#f2f2f7;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;">${p.mensagem}</p>
    </div>

    ${btn(p.painelUrl, 'Ver no painel')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;">
      Responda diretamente para este e-mail ou acesse o painel para gerenciar seus leads.
    </p>
  `)
}
