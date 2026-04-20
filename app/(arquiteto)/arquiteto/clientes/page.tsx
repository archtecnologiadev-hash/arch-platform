'use client'

import { Users } from 'lucide-react'

export default function ClientesPage() {
  return (
    <div style={{ padding: '32px', minHeight: '100vh', background: '#f2f2f7', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Clientes</h1>
        <p style={{ fontSize: 13, color: '#6b6b6b' }}>Gerencie sua base de clientes</p>
      </div>

      <div style={{
        background: '#ffffff', border: '1px solid rgba(0,0,0,0.08)',
        borderRadius: 14, padding: '64px 24px', textAlign: 'center',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
      }}>
        <Users size={40} color="#c7c7cc" style={{ marginBottom: 14 }} />
        <p style={{ fontSize: 14, color: '#6b6b6b', marginBottom: 6 }}>Nenhum cliente ainda</p>
        <p style={{ fontSize: 12, color: '#8e8e93' }}>
          Clientes vinculados aos seus projetos aparecerão aqui
        </p>
      </div>
    </div>
  )
}
