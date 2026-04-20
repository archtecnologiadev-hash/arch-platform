'use client'

import { FileText } from 'lucide-react'

export default function OrcamentosPage() {
  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f2f2f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Orçamentos</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b' }}>Controle os orçamentos dos projetos</p>
      </div>

      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14, padding: '64px 24px', textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <FileText size={40} color="#c7c7cc" style={{ marginBottom: 14 }} />
        <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>Nenhum orçamento ainda</p>
        <p style={{ fontSize: 12, color: '#8e8e93' }}>
          Quando você solicitar orçamentos de fornecedores, eles aparecerão aqui
        </p>
      </div>
    </div>
  )
}
