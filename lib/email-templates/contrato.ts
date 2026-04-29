import { baseTemplate, btn, divider, label, value } from './base'

export function contratoEnviadoEmail(params: {
  nomeCliente: string
  nomeEscritorio: string
  tituloProjeto: string
  tituloContrato: string
  linkContrato: string
}): string {
  const content = `
    <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#1a1a1a;">Você recebeu um contrato para revisão</p>
    <p style="margin:0 0 24px;font-size:14px;color:#3a3a3c;line-height:1.6;">
      Olá, <strong>${params.nomeCliente}</strong>. O escritório <strong>${params.nomeEscritorio}</strong> enviou um contrato para o seu projeto.
      Acesse o portal para revisar e assinar digitalmente.
    </p>
    ${divider()}
    ${label('Contrato')}
    ${value(params.tituloContrato)}
    ${label('Projeto')}
    ${value(params.tituloProjeto)}
    ${btn(params.linkContrato, 'Revisar e Assinar Contrato')}
    ${divider()}
    <p style="margin:16px 0 0;font-size:12px;color:#8e8e93;line-height:1.6;">
      Ao acessar o link acima, você poderá ler o contrato completo e assinar digitalmente.<br>
      Sua assinatura digital tem validade jurídica conforme a legislação brasileira.
    </p>
  `
  return baseTemplate(content)
}

export function contratoAssinadoEmail(params: {
  nomeArquiteto: string
  nomeCliente: string
  tituloProjeto: string
  tituloContrato: string
  assinadoEm: string
  linkContrato: string
}): string {
  const content = `
    <p style="margin:0 0 20px;font-size:15px;font-weight:700;color:#10b981;">✓ Contrato assinado</p>
    <p style="margin:0 0 24px;font-size:14px;color:#3a3a3c;line-height:1.6;">
      <strong>${params.nomeCliente}</strong> assinou o contrato <strong>${params.tituloContrato}</strong>
      em ${params.assinadoEm}.
    </p>
    ${divider()}
    ${label('Projeto')}
    ${value(params.tituloProjeto)}
    ${label('Assinado em')}
    ${value(params.assinadoEm)}
    ${btn(params.linkContrato, 'Ver Contrato Assinado')}
  `
  return baseTemplate(content)
}
