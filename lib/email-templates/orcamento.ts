import { baseTemplate, btn, label, value, divider } from './base'

interface OrcamentoEmailProps {
  fornecedorNome: string
  escritorioNome: string
  projetoNome?: string | null
  descricao: string
  responderUrl: string
}

export function orcamentoEmail(p: OrcamentoEmailProps): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Novo orçamento solicitado</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;">
      Olá, ${p.fornecedorNome}! O escritório <strong>${p.escritorioNome}</strong> solicitou um orçamento.
    </p>

    ${divider()}

    ${label('Escritório')}
    ${value(p.escritorioNome)}

    ${p.projetoNome ? `${label('Projeto')}${value(p.projetoNome)}` : ''}

    ${label('Descrição')}
    <div style="background:#f2f2f7;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
      <p style="margin:0;font-size:14px;color:#1a1a1a;line-height:1.6;">${p.descricao}</p>
    </div>

    ${btn(p.responderUrl, 'Responder orçamento')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;">
      Acesse o painel para ver os detalhes e enviar sua proposta.
    </p>
  `)
}
