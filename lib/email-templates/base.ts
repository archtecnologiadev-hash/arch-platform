export function baseTemplate(content: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>ARC</title>
</head>
<body style="margin:0;padding:0;background:#f2f2f7;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f2f7;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;">
          <!-- Card -->
          <tr>
            <td style="background:#ffffff;border-radius:16px;padding:40px;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
              <!-- Logo -->
              <div style="font-size:20px;font-weight:900;letter-spacing:0.25em;color:#1a1a1a;margin-bottom:32px;">ARC</div>
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:20px 0;text-align:center;font-size:11px;color:#8e8e93;line-height:1.6;">
              ARC — Plataforma de Arquitetura &middot;
              <a href="https://usearc.com.br" style="color:#8e8e93;text-decoration:none;">usearc.com.br</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function btn(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#007AFF;color:#ffffff;padding:14px 28px;border-radius:10px;text-decoration:none;font-weight:700;font-size:14px;margin-top:24px;">${label}</a>`
}

export function label(text: string): string {
  return `<p style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#8e8e93;text-transform:uppercase;">${text}</p>`
}

export function value(text: string): string {
  return `<p style="margin:0 0 16px;font-size:14px;color:#1a1a1a;line-height:1.5;">${text}</p>`
}

export function divider(): string {
  return `<hr style="border:none;border-top:1px solid rgba(0,0,0,0.08);margin:24px 0;" />`
}
