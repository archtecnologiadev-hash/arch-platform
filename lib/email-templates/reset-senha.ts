import { baseTemplate, btn, divider } from './base'

export function resetSenhaEmail({ link }: { link: string }): string {
  return baseTemplate(`
    <h2 style="margin:0 0 12px;font-size:22px;font-weight:800;color:#1a1a1a;">Redefinir sua senha</h2>
    <p style="margin:0 0 24px;font-size:14px;color:#6b6b6b;line-height:1.6;">
      Recebemos uma solicitação para redefinir a senha da sua conta ARC.
      Se foi você, clique no botão abaixo. Se não foi, ignore este email — sua senha não será alterada.
    </p>

    ${btn(link, 'Redefinir senha')}

    ${divider()}

    <p style="margin:0;font-size:12px;color:#8e8e93;line-height:1.6;">
      O link expira em 1 hora por segurança. Se você não solicitou a redefinição de senha, nenhuma ação é necessária.
    </p>
  `)
}
