import { baseTemplate, btn, divider } from './base'

interface TrialEmailProps {
  nome: string
  diasRestantes: number
  planosUrl: string
}

export function trialEmail(p: TrialEmailProps): string {
  return baseTemplate(`
    <h2 style="margin:0 0 8px;font-size:22px;font-weight:800;color:#1a1a1a;">Seu trial termina em ${p.diasRestantes} dia${p.diasRestantes !== 1 ? 's' : ''}</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;">
      Olá, ${p.nome}! Aproveite ao máximo os recursos da ARC enquanto seu período de teste ainda está ativo.
    </p>

    ${divider()}

    <div style="background:rgba(0,122,255,0.06);border:1px solid rgba(0,122,255,0.2);border-radius:12px;padding:20px;margin-bottom:16px;">
      <p style="margin:0 0 8px;font-size:14px;font-weight:700;color:#007AFF;">
        ⏱ ${p.diasRestantes} dia${p.diasRestantes !== 1 ? 's' : ''} restante${p.diasRestantes !== 1 ? 's' : ''}
      </p>
      <p style="margin:0;font-size:13px;color:#1a1a1a;line-height:1.5;">
        Escolha um plano para continuar usando todos os recursos sem interrupção.
      </p>
    </div>

    ${btn(p.planosUrl, 'Escolher plano')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;">
      Após o trial, sua conta será limitada ao plano gratuito. Faça upgrade para manter todos os recursos.
    </p>
  `)
}
