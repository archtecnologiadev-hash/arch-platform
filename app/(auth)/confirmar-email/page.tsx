'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Mail, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react'

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '12px 14px',
  background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.1)',
  borderRadius: 10,
  color: '#1a1a1a',
  fontSize: 15,
  fontWeight: 300,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
}

function ConfirmarEmailContent() {
  const searchParams = useSearchParams()
  const erro = searchParams.get('erro')

  const [email, setEmail]         = useState('')
  const [sending, setSending]     = useState(false)
  const [cooldown, setCooldown]   = useState(0)
  const [sent, setSent]           = useState(false)
  const [errorMsg, setErrorMsg]   = useState('')

  async function handleResend(e: React.FormEvent) {
    e.preventDefault()
    if (!email || cooldown > 0 || sending) return
    setSending(true)
    setErrorMsg('')
    try {
      const res = await fetch('/api/auth/reenviar-confirmacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (data.error) {
        setErrorMsg(data.error)
      } else {
        setSent(true)
        let secs = 60
        setCooldown(secs)
        const iv = setInterval(() => {
          secs -= 1
          setCooldown(secs)
          if (secs <= 0) clearInterval(iv)
        }, 1000)
      }
    } catch {
      setErrorMsg('Erro ao enviar. Tente novamente.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{
      background: '#ffffff',
      border: '1px solid rgba(0,0,0,0.08)',
      borderRadius: 16,
      padding: '40px 32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      textAlign: 'center',
    }}>
      {erro === 'link-invalido' ? (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <AlertCircle size={24} color="#ff3b30" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 400, color: '#1a1a1a', marginBottom: 8 }}>
            Link inválido ou expirado
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 28 }}>
            O link de confirmação expirou ou já foi utilizado.
            Informe seu email para receber um novo link.
          </p>
        </>
      ) : (
        <>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(0,122,255,0.08)', border: '1px solid rgba(0,122,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
          }}>
            <Mail size={24} color="#007AFF" />
          </div>
          <h1 style={{ fontSize: 20, fontWeight: 400, color: '#1a1a1a', marginBottom: 8 }}>
            Confirme seu email
          </h1>
          <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: 28 }}>
            Informe seu email para receber o link de confirmação.
          </p>
        </>
      )}

      {sent ? (
        <div style={{
          padding: '16px',
          background: 'rgba(5,150,105,0.06)',
          border: '1px solid rgba(5,150,105,0.2)',
          borderRadius: 10,
          display: 'flex', alignItems: 'center', gap: 10,
          justifyContent: 'center',
        }}>
          <CheckCircle2 size={18} color="#059669" />
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: 13, fontWeight: 500, color: '#059669', margin: 0 }}>Email enviado!</p>
            <p style={{ fontSize: 12, color: '#6b6b6b', margin: '2px 0 0' }}>
              Verifique sua caixa de entrada e a pasta de spam.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleResend} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            style={{ ...inputBase, textAlign: 'left' }}
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.1)')}
          />

          {errorMsg && (
            <p style={{ fontSize: 12, color: '#ff3b30', margin: 0 }}>{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={cooldown > 0 || sending || !email}
            style={{
              padding: '13px',
              background: cooldown > 0 || sending ? '#a0c4ff' : '#007AFF',
              color: '#ffffff', border: 'none', borderRadius: 10,
              fontSize: 14, fontWeight: 500,
              cursor: cooldown > 0 || sending ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}
          >
            <RotateCcw size={14} />
            {sending ? 'Enviando…' : cooldown > 0 ? `Aguarde ${cooldown}s` : 'Enviar link de confirmação'}
          </button>
        </form>
      )}

      <p style={{ marginTop: 24, fontSize: 12, color: '#8e8e93' }}>
        <Link href="/login" style={{ color: '#007AFF', textDecoration: 'none' }}>
          Voltar para o login
        </Link>
      </p>
    </div>
  )
}

export default function ConfirmarEmailPage() {
  return (
    <Suspense fallback={
      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16, padding: '36px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <div style={{ fontSize: 13, color: '#8e8e93' }}>Carregando…</div>
      </div>
    }>
      <ConfirmarEmailContent />
    </Suspense>
  )
}
