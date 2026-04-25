import { Resend } from 'resend'

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string
  subject: string
  html: string
}) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[email] RESEND_API_KEY not set — skipping email')
    return false
  }
  const resend = new Resend(apiKey)
  const { error } = await resend.emails.send({
    from: 'ARC <noreply@usearc.com.br>',
    to,
    subject,
    html,
  })
  if (error) console.error('[email]', error)
  return !error
}
