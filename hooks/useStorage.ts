'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'

export interface StorageInfo {
  loading: boolean
  usedBytes: number
  usedGb: number
}

export function useStorage(userId: string | null): StorageInfo {
  const [info, setInfo] = useState<StorageInfo>({ loading: true, usedBytes: 0, usedGb: 0 })

  useEffect(() => {
    if (!userId) { setInfo({ loading: false, usedBytes: 0, usedGb: 0 }); return }
    let cancelled = false
    async function load() {
      try {
        const supabase = createClient()
        const { data, error } = await supabase.rpc('calcular_armazenamento_usado', { p_user_id: userId })
        if (cancelled) return
        if (error) throw error
        const bytes = Number(data ?? 0)
        setInfo({ loading: false, usedBytes: bytes, usedGb: bytes / (1024 ** 3) })
      } catch {
        if (!cancelled) setInfo({ loading: false, usedBytes: 0, usedGb: 0 })
      }
    }
    load()
    return () => { cancelled = true }
  }, [userId])

  return info
}
