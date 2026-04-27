import { baseTemplate, btn, label, value, divider } from './base'

export function cobrancaTemplate({
  nome,
  valor,
  descricao,
  vencimento,
  pixChave,
}: {
  nome: string
  valor: string
  descricao: string
  vencimento: string
  pixChave?: string | null
}): string {
  const pixSection = pixChave
    ? `${divider()}
       ${label('Chave PIX para pagamento')}
       <div style="background:#f2f2f7;border-radius:10px;padding:14px 16px;font-family:monospace;font-size:14px;color:#1a1a1a;word-break:break-all;margin-bottom:16px;">${pixChave}</div>`
    : ''

  const content = `
    <p style="margin:0 0 24px;font-size:15px;color:#1a1a1a;line-height:1.6;">
      Olá, <strong>${nome}</strong>!<br/>
      Uma cobrança foi gerada para sua conta na plataforma ARC.
    </p>

    ${label('Descrição')}
    ${value(descricao)}

    ${label('Valor')}
    <p style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">R$ ${valor}</p>

    ${label('Vencimento')}
    ${value(vencimento)}

    ${pixSection}

    ${divider()}

    <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b;line-height:1.6;">
      Após realizar o pagamento, aguarde a confirmação pela nossa equipe.
      Em caso de dúvidas, entre em contato em <a href="mailto:contato@usearc.com.br" style="color:#007AFF;">contato@usearc.com.br</a>.
    </p>

    ${btn('https://usearc.com.br', 'Acessar minha conta')}
  `

  return baseTemplate(content)
}
