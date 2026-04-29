'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Mail, CheckCircle2, RotateCcw, LogOut } from 'lucide-react'

export default function ConfirmarEmailPendentePage() {
  const router = useRouter()
  const [email, setEmail]         = useState('')
  const [loaded, setLoaded]       = useState(false)
  const [sending, setSending]     = useState(false)
  const [cooldown, setCooldown]   = useState(0)
  const [sent, setSent]           = useState(false)
  const [errorMsg, setErrorMsg]   = useState('')

  // Fetch the current user's email on mount
  useState(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email) setEmail(data.user.email)
      setLoaded(true)
    })
  })

  async function handleResend() {
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

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f2f2f7',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
    }}>
      <span style={{ marginBottom: 32, fontSize: 20, fontWeight: 300, letterSpacing: '0.35em', color: '#007AFF' }}>
        ARC
      </span>

      <div style={{
        width: '100%', maxWidth: 440,
        background: '#ffffff',
        border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 16,
        padding: '40px 32px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
        textAlign: 'center',
      }}>
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
        <p style={{ fontSize: 13, color: '#6b6b6b', lineHeight: 1.6, marginBottom: loaded && email ? 6 : 24 }}>
          Seu email ainda não foi confirmado. Verifique sua caixa de entrada
          e clique no link de ativação para acessar a plataforma.
        </p>

        {loaded && email && (
          <p style={{ fontSize: 14, fontWeight: 500, color: '#1a1a1a', marginBottom: 24 }}>
            {email}
          </p>
        )}

        {sent ? (
          <div style={{
            padding: '14px 16px', marginBottom: 16,
            background: 'rgba(5,150,105,0.06)',
            border: '1px solid rgba(5,150,105,0.2)',
            borderRadius: 10,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <CheckCircle2 size={18} color="#059669" />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: 13, fontWeight: 500, color: '#059669', margin: 0 }}>Email reenviado!</p>
              <p style={{ fontSize: 12, color: '#6b6b6b', margin: '2px 0 0' }}>
                Verifique também a pasta de spam.
              </p>
            </div>
          </div>
        ) : (
          <>
            {errorMsg && (
              <p style={{ fontSize: 12, color: '#ff3b30', marginBottom: 10 }}>{errorMsg}</p>
            )}
            <button
              onClick={handleResend}
              disabled={cooldown > 0 || sending || !email}
              style={{
                width: '100%', padding: '13px', marginBottom: 12,
                background: cooldown > 0 ? '#f2f2f7' : 'rgba(0,122,255,0.08)',
                border: `1px solid ${cooldown > 0 ? 'rgba(0,0,0,0.08)' : 'rgba(0,122,255,0.2)'}`,
                color: cooldown > 0 ? '#8e8e93' : '#007AFF',
                borderRadius: 10, fontSize: 14, fontWeight: 500,
                cursor: cooldown > 0 || sending || !email ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              <RotateCcw size={14} />
              {sending ? 'Enviando…' : cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Reenviar email de confirmação'}
            </button>
          </>
        )}

        <button
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px',
            background: 'transparent', border: '1px solid rgba(0,0,0,0.1)',
            color: '#8e8e93', borderRadius: 10, fontSize: 13,
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}
        >
          <LogOut size={13} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
