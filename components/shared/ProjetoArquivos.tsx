'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import {
  Folder, FolderOpen, ChevronRight, Upload, Camera, PenLine,
  X, Download, ZoomIn, Loader2, RotateCcw, Trash2,
  Image as ImageIcon, FileText, File as LucideFile, Check, Plus,
} from 'lucide-react'

// ─── Types ───────────────────────────────────────────────────────────────────

interface Pasta {
  id: string
  nome: string
  pasta_pai_id: string | null
  ordem: number
  created_at: string
}

interface Arquivo {
  id: string
  nome: string
  url: string
  tipo: string | null
  tamanho: number | null
  pasta_id: string | null
  enviado_por_nome: string | null
  created_at: string
}

interface Props {
  projetoId: string
  currentUser: { id: string; nome: string } | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function detectTipo(nome: string): string {
  const ext = nome.split('.').pop()?.toLowerCase() ?? ''
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic', 'avif'].includes(ext)) return 'imagem'
  if (['pdf'].includes(ext)) return 'pdf'
  if (['dwg', 'dxf'].includes(ext)) return 'cad'
  if (['doc', 'docx'].includes(ext)) return 'doc'
  if (['xls', 'xlsx'].includes(ext)) return 'planilha'
  return 'outro'
}

function fmtBytes(n: number | null): string {
  if (!n) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function isImage(tipo: string | null) {
  return tipo === 'imagem'
}

function FileIcon({ tipo }: { tipo: string | null }) {
  if (tipo === 'imagem') return <ImageIcon size={15} color="var(--accent)" />
  if (tipo === 'pdf') return <FileText size={15} color="#ef4444" />
  if (tipo === 'cad') return <FileText size={15} color="#f59e0b" />
  return <LucideFile size={15} color="#8e8e93" />
}

// ─── Camera Tool ─────────────────────────────────────────────────────────────

function CameraCapture({ onSave, onClose }: { onSave: (blob: Blob, desc: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [captured, setCaptured] = useState<string | null>(null)
  const [capturedBlob, setCapturedBlob] = useState<Blob | null>(null)
  const [desc, setDesc] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
        }
      })
      .catch(() => setErr('Câmera não disponível ou sem permissão.'))
    return () => { streamRef.current?.getTracks().forEach(t => t.stop()) }
  }, [])

  function capture() {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(blob => {
      if (!blob) return
      setCaptured(canvas.toDataURL('image/jpeg', 0.85))
      setCapturedBlob(blob)
      streamRef.current?.getTracks().forEach(t => t.stop())
    }, 'image/jpeg', 0.85)
  }

  function retake() {
    setCaptured(null)
    setCapturedBlob(null)
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false })
      .then(stream => {
        streamRef.current = stream
        if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play() }
      })
  }

  function save() {
    if (capturedBlob) onSave(capturedBlob, desc)
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'rgba(0,0,0,0.6)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 600 }}>
          <X size={18} /> Fechar
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Câmera</span>
        <div style={{ width: 60 }} />
      </div>

      {err ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 14, padding: 24, textAlign: 'center' }}>{err}</div>
      ) : captured ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
          <img src={captured} alt="captura" style={{ maxWidth: '100%', maxHeight: '60vh', borderRadius: 10, objectFit: 'contain' }} />
          <input
            value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="Descrição da foto (opcional)"
            style={{ width: '100%', maxWidth: 400, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 16px', color: '#fff', fontSize: 14, outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={retake} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)', borderRadius: 10, padding: '12px 20px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
              <RotateCcw size={16} /> Refazer
            </button>
            <button onClick={save} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--btn-bg)', border: 'none', borderRadius: 10, padding: '12px 24px', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>
              <Check size={16} /> Salvar foto
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          <video ref={videoRef} playsInline muted style={{ maxWidth: '100%', maxHeight: '70vh', borderRadius: 10 }} />
          <button onClick={capture} style={{ width: 70, height: 70, borderRadius: '50%', background: 'var(--bg-card)', border: '4px solid rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={28} color="#000" />
          </button>
        </div>
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </div>
  )
}

// ─── Drawing Tool ─────────────────────────────────────────────────────────────

function DrawingTool({ onSave, onClose }: { onSave: (blob: Blob, desc: string) => void; onClose: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [drawing, setDrawing] = useState(false)
  const [color, setColor] = useState('#1a1a1a')
  const [size, setSize] = useState(4)
  const [desc, setDesc] = useState('')
  const lastPos = useRef<{ x: number; y: number } | null>(null)

  const colors = ['#1a1a1a', '#ef4444', '#007AFF', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#ffffff']

  function getPos(e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) {
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY }
    }
    return { x: ((e as React.MouseEvent).clientX - rect.left) * scaleX, y: ((e as React.MouseEvent).clientY - rect.top) * scaleY }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    const canvas = canvasRef.current; if (!canvas) return
    setDrawing(true)
    lastPos.current = getPos(e, canvas)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing) return
    const canvas = canvasRef.current; if (!canvas) return
    const ctx = canvas.getContext('2d'); if (!ctx) return
    const pos = getPos(e, canvas)
    if (lastPos.current) {
      ctx.beginPath()
      ctx.moveTo(lastPos.current.x, lastPos.current.y)
      ctx.lineTo(pos.x, pos.y)
      ctx.strokeStyle = color
      ctx.lineWidth = size
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()
    }
    lastPos.current = pos
  }

  function endDraw() { setDrawing(false); lastPos.current = null }

  function clear() {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
  }

  function save() {
    const canvas = canvasRef.current; if (!canvas) return
    canvas.toBlob(blob => { if (blob) onSave(blob, desc) }, 'image/png')
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1a1a1a', zIndex: 200, display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#2a2a2a', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <X size={18} /> Fechar
        </button>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Croqui</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={clear} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', color: '#fff', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
            <RotateCcw size={14} /> Limpar
          </button>
          <button onClick={save} style={{ background: 'var(--btn-bg)', border: 'none', borderRadius: 8, padding: '8px 16px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Check size={14} /> Salvar
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', background: '#2a2a2a', borderBottom: '1px solid rgba(255,255,255,0.08)', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {colors.map(c => (
            <button key={c} onClick={() => setColor(c)} style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: color === c ? '3px solid #007AFF' : '2px solid rgba(255,255,255,0.25)', cursor: 'pointer', boxSizing: 'border-box' }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 8 }}>
          <span style={{ color: 'var(--text-3)', fontSize: 12 }}>Espessura:</span>
          {[2, 4, 8, 14].map(s => (
            <button key={s} onClick={() => setSize(s)} style={{ width: 28, height: 28, borderRadius: 6, background: size === s ? 'rgba(0,122,255,0.3)' : 'rgba(255,255,255,0.08)', border: size === s ? '1px solid #007AFF' : '1px solid rgba(255,255,255,0.15)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: s, height: s, borderRadius: '50%', background: 'var(--bg-card)' }} />
            </button>
          ))}
        </div>
      </div>

      {/* Canvas */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 16, gap: 12 }}>
        <canvas
          ref={canvasRef}
          width={900} height={600}
          style={{ background: 'var(--bg-card)', borderRadius: 10, cursor: 'crosshair', maxWidth: '100%', maxHeight: 'calc(100% - 80px)', touchAction: 'none' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        <input
          value={desc} onChange={e => setDesc(e.target.value)}
          placeholder="Título do croqui (opcional)"
          style={{ width: '100%', maxWidth: 500, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '10px 14px', color: '#fff', fontSize: 13, outline: 'none' }}
        />
      </div>
    </div>
  )
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({ url, nome, onClose }: { url: string; nome: string; onClose: () => void }) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 300, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', top: 16, right: 20, display: 'flex', gap: 10 }}>
        <a href={url} download={nome} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 14px', color: '#fff', textDecoration: 'none', fontSize: 13 }}>
          <Download size={14} /> Baixar
        </a>
        <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, padding: '8px 12px', color: '#fff', cursor: 'pointer' }}>
          <X size={16} />
        </button>
      </div>
      <img src={url} alt={nome} onClick={e => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '85vh', objectFit: 'contain', borderRadius: 8 }} />
      <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12, marginTop: 12 }}>{nome}</p>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ProjetoArquivos({ projetoId, currentUser }: Props) {
  const [pastas, setPastas] = useState<Pasta[]>([])
  const [arquivos, setArquivos] = useState<Arquivo[]>([])
  const [currentPastaId, setCurrentPastaId] = useState<string | null>(null)
  const [breadcrumb, setBreadcrumb] = useState<Pasta[]>([])

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [showCamera, setShowCamera] = useState(false)
  const [showDraw, setShowDraw] = useState(false)
  const [lightbox, setLightbox] = useState<Arquivo | null>(null)

  const [showNewFolder, setShowNewFolder] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [savingFolder, setSavingFolder] = useState(false)

  const [deletingId, setDeletingId] = useState<string | null>(null)

  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    const [{ data: pData }, { data: aData }] = await Promise.all([
      supabase.from('projeto_pastas').select('*').eq('projeto_id', projetoId).order('ordem').order('nome'),
      supabase.from('arquivos_projeto').select('*').eq('projeto_id', projetoId).order('created_at', { ascending: false }),
    ])
    setPastas((pData ?? []) as Pasta[])
    setArquivos((aData ?? []) as Arquivo[])
    setLoading(false)
  }, [projetoId])

  useEffect(() => { load() }, [load])

  function enterFolder(pasta: Pasta) {
    setCurrentPastaId(pasta.id)
    setBreadcrumb(prev => [...prev, pasta])
  }

  function goToRoot() { setCurrentPastaId(null); setBreadcrumb([]) }

  function goToBreadcrumb(pasta: Pasta, idx: number) {
    setCurrentPastaId(pasta.id)
    setBreadcrumb(prev => prev.slice(0, idx + 1))
  }

  const childPastas = pastas.filter(p => p.pasta_pai_id === currentPastaId)
  const currentArquivos = arquivos.filter(a => a.pasta_id === currentPastaId)

  async function uploadFile(file: File, pastaId: string | null) {
    if (!currentUser) return
    const supabase = createClient()
    const safeName = file.name.replace(/[^a-zA-Z0-9._\-]/g, '_')
    const path = `${currentUser.id}/${projetoId}/${Date.now()}_${safeName}`
    const { error: upErr } = await supabase.storage.from('projetos').upload(path, file, { upsert: false })
    if (upErr) { console.error('upload error:', upErr); return }
    const { data: { publicUrl } } = supabase.storage.from('projetos').getPublicUrl(path)
    const { data: arq, error } = await supabase.from('arquivos_projeto')
      .insert({ projeto_id: projetoId, nome: file.name, url: publicUrl, tipo: detectTipo(file.name), tamanho: file.size, enviado_por: currentUser.id, enviado_por_nome: currentUser.nome, pasta_id: pastaId })
      .select('*').single()
    if (!error && arq) setArquivos(prev => [arq as Arquivo, ...prev])
  }

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return
    setUploading(true)
    for (const file of Array.from(files)) await uploadFile(file, currentPastaId)
    setUploading(false)
  }

  async function handleCameraCapture(blob: Blob, desc: string) {
    setShowCamera(false)
    setUploading(true)
    const nome = desc.trim() || `foto_${Date.now()}.jpg`
    const file = new File([blob], nome.endsWith('.jpg') ? nome : `${nome}.jpg`, { type: 'image/jpeg' })
    await uploadFile(file, currentPastaId)
    setUploading(false)
  }

  async function handleDrawSave(blob: Blob, desc: string) {
    setShowDraw(false)
    setUploading(true)
    const nome = desc.trim() || `croqui_${Date.now()}.png`
    const file = new File([blob], nome.endsWith('.png') ? nome : `${nome}.png`, { type: 'image/png' })
    await uploadFile(file, currentPastaId)
    setUploading(false)
  }

  async function createFolder() {
    if (!newFolderName.trim() || !currentUser) return
    setSavingFolder(true)
    const supabase = createClient()
    const { data, error } = await supabase.from('projeto_pastas')
      .insert({ projeto_id: projetoId, nome: newFolderName.trim(), pasta_pai_id: currentPastaId, criado_por: currentUser.id, ordem: childPastas.length })
      .select('*').single()
    if (!error && data) {
      setPastas(prev => [...prev, data as Pasta])
      setNewFolderName('')
      setShowNewFolder(false)
    }
    setSavingFolder(false)
  }

  async function deleteFile(arq: Arquivo) {
    setDeletingId(arq.id)
    const supabase = createClient()
    await supabase.from('arquivos_projeto').delete().eq('id', arq.id)
    setArquivos(prev => prev.filter(a => a.id !== arq.id))
    setDeletingId(null)
  }

  const actionBtn = (label: string, icon: React.ReactNode, onClick: () => void, primary = false) => (
    <button onClick={onClick} style={{ display: 'flex', alignItems: 'center', gap: 7, background: primary ? '#007AFF' : 'rgba(0,122,255,0.08)', border: primary ? 'none' : '1px solid rgba(0,122,255,0.2)', borderRadius: 10, padding: '11px 16px', color: primary ? '#fff' : '#007AFF', cursor: 'pointer', fontSize: 13, fontWeight: 600, minHeight: 44 }}>
      {icon}{label}
    </button>
  )

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <Loader2 size={22} color="var(--accent)" style={{ animation: 'spin 1s linear infinite' }} />
    </div>
  )

  return (
    <>
      {showCamera && <CameraCapture onSave={handleCameraCapture} onClose={() => setShowCamera(false)} />}
      {showDraw && <DrawingTool onSave={handleDrawSave} onClose={() => setShowDraw(false)} />}
      {lightbox && <Lightbox url={lightbox.url} nome={lightbox.nome} onClose={() => setLightbox(null)} />}

      <input ref={fileInputRef} type="file" multiple accept="*/*" style={{ display: 'none' }}
        onChange={e => { handleFiles(e.target.files); e.target.value = '' }} />

      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16, flexWrap: 'wrap' }}>
        <button onClick={goToRoot} style={{ background: 'none', border: 'none', color: currentPastaId ? '#007AFF' : '#1a1a1a', cursor: currentPastaId ? 'pointer' : 'default', fontSize: 13, fontWeight: 600, padding: '4px 2px', display: 'flex', alignItems: 'center', gap: 5 }}>
          <FolderOpen size={14} /> Arquivos
        </button>
        {breadcrumb.map((p, i) => (
          <span key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ChevronRight size={14} color="#8e8e93" />
            <button onClick={() => goToBreadcrumb(p, i)} style={{ background: 'none', border: 'none', color: i === breadcrumb.length - 1 ? '#1a1a1a' : '#007AFF', cursor: i === breadcrumb.length - 1 ? 'default' : 'pointer', fontSize: 13, fontWeight: 600, padding: '4px 2px' }}>
              {p.nome}
            </button>
          </span>
        ))}
      </div>

      {/* Action bar */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {actionBtn(uploading ? 'Enviando...' : 'Enviar arquivo', uploading ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <Upload size={15} />, () => fileInputRef.current?.click(), true)}
        {actionBtn('Câmera', <Camera size={15} />, () => setShowCamera(true))}
        {actionBtn('Croqui', <PenLine size={15} />, () => setShowDraw(true))}
        {actionBtn('Nova pasta', <Plus size={15} />, () => setShowNewFolder(true))}
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16, alignItems: 'center' }}>
          <input
            autoFocus value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') createFolder(); if (e.key === 'Escape') setShowNewFolder(false) }}
            placeholder="Nome da pasta"
            style={{ flex: 1, background: 'var(--bg-card)', border: '1px solid rgba(0,122,255,0.4)', borderRadius: 8, padding: '10px 14px', fontSize: 13, outline: 'none', color: 'var(--text)' }}
          />
          <button onClick={createFolder} disabled={savingFolder || !newFolderName.trim()} style={{ background: 'var(--btn-bg)', border: 'none', borderRadius: 8, padding: '10px 16px', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
            {savingFolder ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : 'Criar'}
          </button>
          <button onClick={() => setShowNewFolder(false)} style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid var(--border-input)', borderRadius: 8, padding: '10px 14px', color: 'var(--text-3)', cursor: 'pointer', fontSize: 13 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Drop zone (only when no folders or files) */}
      {childPastas.length === 0 && currentArquivos.length === 0 && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          onClick={() => fileInputRef.current?.click()}
          style={{ border: `2px dashed ${dragOver ? '#007AFF' : 'rgba(0,0,0,0.15)'}`, borderRadius: 12, padding: '36px 24px', textAlign: 'center', cursor: 'pointer', background: dragOver ? 'rgba(0,122,255,0.04)' : '#fff', transition: 'border-color 0.2s', marginBottom: 16 }}>
          <Upload size={24} color="#8e8e93" style={{ marginBottom: 10 }} />
          <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>Arraste arquivos ou use os botões acima</div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 4 }}>PDF, DWG, JPG, PNG e outros</div>
        </div>
      )}

      {/* Folders */}
      {childPastas.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 10, marginBottom: 20 }}>
          {childPastas.map(p => (
            <button key={p.id} onClick={() => enterFolder(p)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', boxShadow: 'var(--shadow-card)', transition: 'border-color 0.15s, box-shadow 0.15s', minHeight: 56 }}>
              <Folder size={20} color="#f59e0b" fill="rgba(245,158,11,0.15)" />
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nome}</span>
              <ChevronRight size={14} color="#8e8e93" />
            </button>
          ))}
        </div>
      )}

      {/* Files grid */}
      {currentArquivos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
          {currentArquivos.map(arq => (
            <div key={arq.id} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', boxShadow: 'var(--shadow-card)', position: 'relative' }}>
              {/* Thumbnail or icon */}
              {isImage(arq.tipo) ? (
                <div onClick={() => setLightbox(arq)} style={{ cursor: 'pointer', position: 'relative', paddingTop: '75%', background: 'var(--bg)', overflow: 'hidden' }}>
                  <img src={arq.url} alt={arq.nome} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0)', transition: 'background 0.15s' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0.25)'; const icon = e.currentTarget.querySelector('.zoom-icon') as HTMLElement | null; if (icon) icon.style.opacity = '1' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(0,0,0,0)'; const icon = e.currentTarget.querySelector('.zoom-icon') as HTMLElement | null; if (icon) icon.style.opacity = '0' }}>
                    <ZoomIn size={20} color="#fff" className="zoom-icon" style={{ opacity: 0, transition: 'opacity 0.15s', filter: 'drop-shadow(0 1px 3px rgba(0,0,0,0.5))' }} />
                  </div>
                </div>
              ) : (
                <div style={{ paddingTop: '75%', background: 'var(--bg)', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FileIcon tipo={arq.tipo} />
                  </div>
                </div>
              )}

              {/* Info */}
              <div style={{ padding: '8px 10px' }}>
                <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={arq.nome}>{arq.nome}</div>
                <div style={{ fontSize: 10.5, color: 'var(--text-3)', marginTop: 2 }}>{fmtBytes(arq.tamanho)}</div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
                <a href={arq.url} download={arq.nome} target="_blank" rel="noopener noreferrer"
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px', color: 'var(--accent)', textDecoration: 'none' }}>
                  <Download size={14} />
                </a>
                <button onClick={() => deleteFile(arq)} disabled={deletingId === arq.id}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px', background: 'none', border: 'none', borderLeft: '1px solid rgba(0,0,0,0.06)', color: '#ef4444', cursor: 'pointer' }}>
                  {deletingId === arq.id ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Trash2 size={14} />}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Drag overlay when folder/files exist */}
      {(childPastas.length > 0 || currentArquivos.length > 0) && (
        <div
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
          style={{ marginTop: 16, border: `2px dashed ${dragOver ? '#007AFF' : 'rgba(0,0,0,0.10)'}`, borderRadius: 10, padding: '14px', textAlign: 'center', cursor: 'default', background: dragOver ? 'rgba(0,122,255,0.04)' : 'transparent', transition: 'border-color 0.15s, background 0.15s', fontSize: 12, color: 'var(--text-3)' }}>
          Arraste arquivos aqui para adicionar à pasta atual
        </div>
      )}
    </>
  )
}
