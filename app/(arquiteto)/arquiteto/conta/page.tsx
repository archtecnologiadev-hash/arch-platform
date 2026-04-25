'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { Loader2, Camera, Check } from 'lucide-react'

const inp: React.CSSProperties = {
  width: '100%', padding: '11px 14px', background: '#f2f2f7',
  border: '1px solid rgba(0,0,0,0.08)', borderRadius: 10, fontSize: 14,
  color: '#1a1a1a', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit',
}

export default function MinhaContaPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [form, setForm] = useState({ nome: '', telefone: '' })
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [initials, setInitials] = useState('?')
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [escritorioNome, setEscritorioNome] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      setUserId(user.id)

      const { data } = await supabase
        .from('users')
        .select('nome, telefone, avatar_url, escritorio_vinculado_id')
        .eq('id', user.id)
        .maybeSingle()

      const nome = data?.nome || user.user_metadata?.nome || ''
      setForm({ nome, telefone: data?.telefone ?? '' })
      setAvatarUrl(data?.avatar_url ?? null)
      setInitials(nome.split(' ').slice(0, 2).map((n: string) => n[0]).join('').toUpperCase() || '?')

      if (data?.escritorio_vinculado_id) {
        const { data: esc } = await supabase
          .from('escritorios').select('nome').eq('id', data.escritorio_vinculado_id).maybeSingle()
        if (esc?.nome) setEscritorioNome(esc.nome)
      }

      setLoading(false)
    }
    load()
  }, [])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!userId || saving) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('users').update({
      nome: form.nome.trim(),
      telefone: form.telefone.trim() || null,
    }).eq('id', userId)
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !userId) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const path = `${userId}/avatar.${ext}`
    const { error } = await supabase.storage.from('avatares').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('avatares').getPublicUrl(path)
      await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', userId)
      setAvatarUrl(publicUrl)
    }
    setUploadingAvatar(false)
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <Loader2 size={24} color="#007AFF" style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  return (
    <div style={{ padding: '32px', maxWidth: 560 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>

      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#1a1a1a', marginBottom: 4 }}>Minha Conta</h1>
        {escritorioNome && (
          <div style={{ fontSize: 12, color: '#8e8e93' }}>
            Membro de <span style={{ color: '#007AFF', fontWeight: 600 }}>{escritorioNome}</span>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 32 }}>
        <div style={{ position: 'relative', width: 72, height: 72 }}>
          <div style={{
            width: 72, height: 72, borderRadius: '50%', overflow: 'hidden',
            background: 'rgba(0,122,255,0.1)', border: '2px solid rgba(0,122,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 24, fontWeight: 600, color: '#007AFF',
          }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploadingAvatar}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 26, height: 26, borderRadius: '50%',
              background: '#007AFF', border: '2px solid #fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: uploadingAvatar ? 'not-allowed' : 'pointer',
            }}>
            {uploadingAvatar
              ? <Loader2 size={12} color="#fff" style={{ animation: 'spin 1s linear infinite' }} />
              : <Camera size={12} color="#fff" />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>{form.nome || 'Seu nome'}</div>
          <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 2 }}>Clique no ícone para trocar a foto</div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#6b6b6b', marginBottom: 6, fontWeight: 600 }}>
            Nome completo
          </label>
          <input
            value={form.nome}
            onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
            placeholder="Seu nome"
            style={inp}
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 11, color: '#6b6b6b', marginBottom: 6, fontWeight: 600 }}>
            Telefone
          </label>
          <input
            value={form.telefone}
            onChange={e => setForm(f => ({ ...f, telefone: e.target.value }))}
            placeholder="(11) 99999-9999"
            style={inp}
            onFocus={e => (e.target.style.borderColor = '#007AFF')}
            onBlur={e => (e.target.style.borderColor = 'rgba(0,0,0,0.08)')}
          />
        </div>

        <button
          type="submit"
          disabled={saving || !form.nome.trim()}
          style={{
            padding: '13px', borderRadius: 10, border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            background: saved ? '#34d399' : saving || !form.nome.trim() ? 'rgba(0,122,255,0.4)' : '#007AFF',
            color: '#fff', fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'background 0.2s',
          }}>
          {saved ? <><Check size={15} /> Salvo!</> : saving ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Salvando...</> : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}
