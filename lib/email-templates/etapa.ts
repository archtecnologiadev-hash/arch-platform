import { baseTemplate, btn, label, value, divider } from './base'

interface EtapaEmailProps {
  clienteNome: string
  projetoNome: string
  etapaAnterior: string
  novaEtapa: string
  portalUrl: string
}

export function etapaEmail(p: EtapaEmailProps): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Seu projeto avançou de etapa</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;">
      Olá, ${p.clienteNome}! Há uma atualização no seu projeto.
    </p>

    ${divider()}

    ${label('Projeto')}
    ${value(p.projetoNome)}

    ${label('Etapa anterior')}
    ${value(`<span style="color:#8e8e93;">${p.etapaAnterior}</span>`)}

    ${label('Nova etapa')}
    <div style="display:inline-block;background:rgba(0,122,255,0.08);border:1px solid rgba(0,122,255,0.2);border-radius:20px;padding:6px 16px;margin-bottom:16px;">
      <span style="font-size:13px;font-weight:700;color:#007AFF;">${p.novaEtapa}</span>
    </div>

    ${btn(p.portalUrl, 'Ver meu projeto')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;">
      Acesse o portal para acompanhar o progresso completo do seu projeto.
    </p>
  `)
}
