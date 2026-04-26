import { baseTemplate, btn, divider } from './base'

interface ConviteEmailProps {
  nomeConvidado: string
  nomeEscritorio: string
  cargo?: string | null
  nivel: string
  linkConvite: string
}

const NIVEL_LABEL: Record<string, string> = {
  gestor:      'Gestor',
  operacional: 'Operacional',
  owner:       'Owner',
}

export function conviteEmail(p: ConviteEmailProps): string {
  const nivelLabel = NIVEL_LABEL[p.nivel] ?? p.nivel
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Você foi convidado para uma equipe</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;">
      Olá, ${p.nomeConvidado}! O escritório <strong>${p.nomeEscritorio}</strong> convidou você para fazer parte da equipe na plataforma ARC.
    </p>

    ${divider()}

    <div style="background:#f2f2f7;border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 4px;font-size:13px;font-weight:700;color:#1a1a1a;">${p.nomeEscritorio}</p>
      ${p.cargo ? `<p style="margin:0 0 4px;font-size:13px;color:#6b6b6b;">${p.cargo}</p>` : ''}
      <p style="margin:0;font-size:12px;">
        <span style="background:rgba(0,122,255,0.1);color:#007AFF;padding:2px 10px;border-radius:20px;font-weight:700;">${nivelLabel}</span>
      </p>
    </div>

    ${btn(p.linkConvite, 'Aceitar convite')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;">
      Este link é de uso único e expira após ser aceito. Se você não esperava este convite, ignore este e-mail.
    </p>
  `)
}
