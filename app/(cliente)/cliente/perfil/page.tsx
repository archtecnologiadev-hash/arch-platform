'use client'

import { useState, useEffect, useRef } from 'react'
import { UserCircle, Camera, Save, CheckCircle2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function ClientePerfilPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [nome, setNome] = useState('')
  const [telefone, setTelefone] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)
      setEmail(user.email ?? '')

      const { data } = await supabase
        .from('users').select('nome, telefone, avatar_url').eq('id', user.id).maybeSingle()
      if (data) {
        setNome(data.nome ?? '')
        setTelefone(data.telefone ?? '')
        setAvatarUrl(data.avatar_url ?? null)
      } else {
        setNome(user.user_metadata?.nome ?? '')
      }
      setLoading(false)
    }
    load()
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error: upErr } = await supabase.storage
      .from('avatares').upload(path, file, { upsert: true, contentType: file.type })
    if (upErr) { setUploading(false); return }
    const { data: { publicUrl } } = supabase.storage.from('avatares').getPublicUrl(path)
    const urlWithBust = `${publicUrl}?t=${Date.now()}`
    await supabase.from('users').update({ avatar_url: urlWithBust }).eq('id', userId)
    setAvatarUrl(urlWithBust)
    setUploading(false)
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').upsert({ id: userId, nome: nome.trim(), telefone: telefone.trim() })
    await supabase.auth.updateUser({ data: { nome: nome.trim() } })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const initials = nome ? nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase() : 'C'

  if (loading) {
    return (
      <div style={{ padding: '28px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px 0' }}>
          <Loader2 size={26} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    )
  }

  return (
    <div style={{ padding: '28px 32px', maxWidth: 520 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 700, color: '#1a1a1a', margin: 0 }}>Meu Perfil</h1>
        <p style={{ fontSize: 13, color: '#8e8e93', margin: '5px 0 0' }}>Edite suas informações pessoais</p>
      </div>

      <div style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 16, padding: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        {/* Avatar */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
              background: 'rgba(0,122,255,0.1)', border: '3px solid rgba(0,122,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : uploading
                  ? <Loader2 size={28} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
                  : <span style={{ fontSize: 32, fontWeight: 700, color: '#007AFF' }}>{initials}</span>
              }
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              style={{
                position: 'absolute', bottom: 0, right: 0,
                width: 30, height: 30, borderRadius: '50%',
                background: '#007AFF', border: '2px solid #fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              }}
            >
              <Camera size={13} color="#fff" />
            </button>
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleAvatarChange} style={{ display: 'none' }} />
          <p style={{ fontSize: 11.5, color: '#8e8e93', margin: 0 }}>
            {uploading ? 'Enviando...' : 'Clique no ícone para trocar a foto'}
          </p>
        </div>

        {/* Fields */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>
              Nome completo
            </label>
            <input
              value={nome}
              onChange={e => setNome(e.target.value)}
              placeholder="Seu nome"
              style={{
                width: '100%', padding: '10px 12px',
                background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 10, fontSize: 14, color: '#1a1a1a', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>
              Telefone / WhatsApp
            </label>
            <input
              value={telefone}
              onChange={e => setTelefone(e.target.value)}
              placeholder="(11) 99999-9999"
              style={{
                width: '100%', padding: '10px 12px',
                background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 10, fontSize: 14, color: '#1a1a1a', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit',
              }}
              onFocus={e => (e.target.style.borderColor = 'rgba(0,122,255,0.4)')}
              onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
            />
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#6b6b6b', display: 'block', marginBottom: 6 }}>
              E-mail
            </label>
            <input
              value={email}
              disabled
              style={{
                width: '100%', padding: '10px 12px',
                background: '#f2f2f7', border: '1px solid rgba(0,0,0,0.05)',
                borderRadius: 10, fontSize: 14, color: '#8e8e93', outline: 'none',
                boxSizing: 'border-box', fontFamily: 'inherit', cursor: 'not-allowed',
              }}
            />
            <p style={{ fontSize: 11, color: '#8e8e93', margin: '4px 0 0' }}>
              O e-mail não pode ser alterado
            </p>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !nome.trim()}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              padding: '11px 0', background: saved ? '#34d399' : '#007AFF',
              border: 'none', borderRadius: 10, color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: saving || !nome.trim() ? 'not-allowed' : 'pointer',
              opacity: saving || !nome.trim() ? 0.7 : 1,
              transition: 'background 0.2s',
              width: '100%',
            }}
          >
            {saving
              ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</>
              : saved
                ? <><CheckCircle2 size={15} /> Salvo com sucesso!</>
                : <><Save size={15} /> Salvar alterações</>
            }
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 8, color: '#8e8e93' }}>
        <UserCircle size={14} />
        <span style={{ fontSize: 12 }}>Suas informações são visíveis para o seu arquiteto</span>
      </div>
    </div>
  )
}
