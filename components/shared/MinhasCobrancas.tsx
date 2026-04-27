'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { DollarSign, Copy, Check, ExternalLink } from 'lucide-react'

interface Cobranca {
  id: string
  valor: number
  descricao: string | null
  vencimento: string
  status: 'pendente' | 'pago' | 'cancelado' | 'atrasado'
  pix_chave: string | null
  pix_qrcode_url: string | null
  comprovante_url: string | null
  pago_em: string | null
  created_at: string
}

const STATUS_COLOR: Record<string, string> = {
  pendente: '#f59e0b',
  pago: '#22c55e',
  cancelado: '#8e8e93',
  atrasado: '#ef4444',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  pago: 'Pago',
  cancelado: 'Cancelado',
  atrasado: 'Atrasado — entre em contato',
}

function Badge({ status }: { status: string }) {
  const color = STATUS_COLOR[status] ?? '#8e8e93'
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 20,
      background: `${color}15`, color, border: `1px solid ${color}30`,
    }}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

export default function MinhasCobrancas() {
  const [cobrancas, setCobrancas] = useState<Cobranca[]>([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { setLoading(false); return }
      const { data } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      setCobrancas((data ?? []) as Cobranca[])
      setLoading(false)
    })
  }, [])

  function copyPix(chave: string) {
    navigator.clipboard.writeText(chave).then(() => {
      setCopied(chave)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  if (loading) return null
  if (cobrancas.length === 0) return null

  return (
    <div style={{ marginTop: 32 }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#1a1a1a', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <DollarSign size={16} color="#007AFF" />
        Minhas cobranças
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {cobrancas.map(c => (
          <div key={c.id} style={{
            background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 12,
            padding: '16px 18px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: '#1a1a1a', marginBottom: 3 }}>
                  {c.descricao || 'Cobrança ARC'}
                </div>
                <div style={{ fontSize: 12, color: '#8e8e93' }}>
                  Vencimento: {new Date(c.vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                  {c.pago_em && (
                    <span style={{ marginLeft: 10, color: '#22c55e' }}>
                      · Pago em {new Date(c.pago_em).toLocaleDateString('pt-BR')}
                    </span>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: '#1a1a1a' }}>
                  R$ {Number(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
                <Badge status={c.status} />
              </div>
            </div>

            {/* Chave PIX */}
            {c.pix_chave && ['pendente', 'atrasado'].includes(c.status) && (
              <div style={{ marginTop: 12, background: '#f2f2f7', borderRadius: 9, padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: '#8e8e93', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chave PIX</div>
                  <div style={{ fontFamily: 'monospace', fontSize: 13, color: '#1a1a1a', wordBreak: 'break-all' }}>{c.pix_chave}</div>
                </div>
                <button
                  onClick={() => copyPix(c.pix_chave!)}
                  style={{ display: 'flex', alignItems: 'center', gap: 5, background: copied === c.pix_chave ? 'rgba(34,197,94,0.1)' : 'rgba(0,122,255,0.08)', border: `1px solid ${copied === c.pix_chave ? 'rgba(34,197,94,0.3)' : 'rgba(0,122,255,0.2)'}`, borderRadius: 8, padding: '7px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: copied === c.pix_chave ? '#22c55e' : '#007AFF', flexShrink: 0, transition: 'all 0.2s' }}
                >
                  {copied === c.pix_chave ? <><Check size={12} /> Copiado</> : <><Copy size={12} /> Copiar</>}
                </button>
              </div>
            )}

            {/* Comprovante */}
            {c.comprovante_url && (
              <div style={{ marginTop: 10 }}>
                <a href={c.comprovante_url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#007AFF', textDecoration: 'none' }}>
                  <ExternalLink size={12} /> Ver comprovante
                </a>
              </div>
            )}
          </div>
        ))}
      </div>

      <p style={{ marginTop: 12, fontSize: 12, color: '#8e8e93' }}>
        Dúvidas? Entre em contato em{' '}
        <a href="mailto:contato@usearc.com.br" style={{ color: '#007AFF', textDecoration: 'none' }}>contato@usearc.com.br</a>
      </p>
    </div>
  )
}
